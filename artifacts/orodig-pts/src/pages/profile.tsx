import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RankBadge } from "@/components/layout";
import { Mail, Phone, Calendar, Copy, LogOut, User, Star, TrendingUp, Shield, Edit2, Save, X, ShoppingBag, Package, Camera } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLogout, useUpdateProfile, useListPurchases, getGetMeQueryKey } from "@workspace/api-client-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getApiBase } from "@/lib/api";

const GOLD = "hsl(42,68%,50%)";
const RANK_LIST = [
  "Bronce", "Cobre", "Crisolito", "Belirio Rojo", "Tanzanita Verde",
  "Plata", "Oro", "Esmeralda Azul", "Esmeralda Verde", "Diamante Azul",
  "Danzanita Verde", "Diamante Fantasía", "Zafiro Amarillo", "Alejandrita Especial", "Accionista ORODIG",
];
const RANK_THRESHOLDS_LIST: number[] = [50, 150, 350, 700, 1200, 2500, 5000, 9000, 15000, 23000, 33000, 48000, 70000, 100000, Infinity];

function getMemberStatus(lastPaymentAt: string | null | undefined): { label: string; color: string; bg: string; daysLeft: number } {
  if (!lastPaymentAt) return { label: "Sin registro", color: "#6b7280", bg: "#6b728015", daysLeft: 0 };
  const daysSince = Math.floor((Date.now() - new Date(lastPaymentAt).getTime()) / 86400000);
  if (daysSince <= 30) return { label: "Verde — Activo", color: "#22c55e", bg: "#22c55e15", daysLeft: 30 - daysSince };
  if (daysSince <= 60) return { label: "Amarillo — Pendiente", color: "#eab308", bg: "#eab30815", daysLeft: 60 - daysSince };
  if (daysSince < 180) return { label: "Rojo — Inactivo", color: "#ef4444", bg: "#ef444415", daysLeft: 0 };
  return { label: "Gris — Eliminado", color: "#6b7280", bg: "#6b728015", daysLeft: 0 };
}

const TABS = ["Perfil", "Compras"] as const;
type Tab = typeof TABS[number];

export default function Profile() {
  const { currentMember, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const logoutMutation = useLogout();
  const { data: summary } = useGetDashboardSummary();
  const { data: purchases } = useListPurchases();
  const renewMembership = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("orodig_token");
      const res = await fetch(`${getApiBase()}/api/referrals/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo renovar");
      }
      return res.json();
    },
    onSuccess: (data: { message?: string }) => {
      toast({ title: "Membresía renovada", description: data.message ?? "Tu estado VERDE fue extendido 30 días." });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateProfile = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: "¡Perfil actualizado!", description: "Tu información fue guardada correctamente." });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setActiveTab("Perfil");
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo actualizar el perfil. Verifica tu contraseña actual.", variant: "destructive" });
      },
    },
  });

  const [activeTab, setActiveTab] = useState<Tab>("Perfil");
  const [editForm, setEditForm] = useState({
    fullName: currentMember?.fullName ?? "",
    email: currentMember?.email ?? "",
    phone: currentMember?.phone ?? "",
    currentPassword: "",
    newPassword: "",
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "Por favor elige una imagen de menos de 10MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          updateProfile.mutate({ data: { avatarUrl: dataUrl } });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!currentMember) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(currentMember.referralCode);
    toast({ title: "¡Copiado!", description: "Código de referido copiado al portapapeles" });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => logout() });
  };

  const handleSaveProfile = () => {
    const data: Record<string, unknown> = {};
    if (editForm.fullName && editForm.fullName !== currentMember.fullName) data.fullName = editForm.fullName;
    if (editForm.email && editForm.email !== currentMember.email) data.email = editForm.email;
    if (editForm.phone !== (currentMember.phone ?? "")) data.phone = editForm.phone || null;
    if (editForm.newPassword) {
      data.currentPassword = editForm.currentPassword;
      data.newPassword = editForm.newPassword;
    }
    updateProfile.mutate({ data: data as any });
  };

  const totalEarnings = summary?.totalEarnings ?? 0;
  const rankIdx = RANK_LIST.indexOf(currentMember.rank);
  const nextRank = rankIdx >= 0 && rankIdx < RANK_LIST.length - 1 ? RANK_LIST[rankIdx + 1] : null;
  const prevThreshold = rankIdx <= 0 ? 0 : RANK_THRESHOLDS_LIST[rankIdx - 1];
  const nextThreshold = RANK_THRESHOLDS_LIST[rankIdx] ?? Infinity;
  const progress = nextRank
    ? Math.min(((totalEarnings - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100)
    : 100;
  const memberStatus = getMemberStatus(currentMember.lastPaymentAt);

  const isAdmin = currentMember.username === "admin";

  if (isAdmin) {
    return (
      <div className="space-y-5 max-w-xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI PERFIL</h1>
          <p className="text-muted-foreground text-sm">Información de la cuenta de administrador.</p>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-white/5 text-center py-6">
            <CardContent className="px-4 flex flex-col items-center gap-3">
              <div className="relative group">
                <input
                  type="file"
                  id="admin-avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <label htmlFor="admin-avatar-upload" className="cursor-pointer block relative">
                  {currentMember.avatarUrl ? (
                    <img src={currentMember.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-white/10 hover:brightness-75 transition-all" />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-black hover:brightness-75 transition-all"
                      style={{ background: `linear-gradient(135deg, hsl(273,100%,40%), hsl(273,100%,60%))` }}>
                      {currentMember.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </label>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{currentMember.fullName}</h2>
                <p className="text-muted-foreground text-xs mb-2">@{currentMember.username}</p>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-purple-500/30 bg-purple-500/10 text-purple-300">
                  Administrador General
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-purple-300" />
                Información del Administrador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Mail,     label: "Correo",        value: currentMember.email },
                { icon: Phone,    label: "Teléfono",      value: currentMember.phone ?? "No registrado" },
                { icon: Calendar, label: "Miembro desde", value: format(new Date(currentMember.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</div>
                    <div className="text-white text-sm font-medium truncate">{value}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            variant="destructive"
            className="w-full font-bold uppercase tracking-wider h-11 text-sm bg-red-600/90 hover:bg-red-600 text-white"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI PERFIL</h1>
        <p className="text-muted-foreground text-sm">Tu identidad y estadísticas en la red.</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab ? "text-black" : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab ? { background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PERFIL TAB */}
      {activeTab === "Perfil" && (
        <div className="grid gap-4 md:grid-cols-5">
          {/* Left column */}
          <div className="md:col-span-2 space-y-4">
            <Card className="bg-card border-white/5 text-center py-6">
              <CardContent className="px-4 flex flex-col items-center gap-3">
                <div className="relative group">
                  <input
                    type="file"
                    id="member-avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <label htmlFor="member-avatar-upload" className="cursor-pointer block relative">
                    {currentMember.avatarUrl ? (
                      <img src={currentMember.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-white/10 hover:brightness-75 transition-all" />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-black hover:brightness-75 transition-all"
                        style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
                        {currentMember.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </label>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card flex items-center justify-center"
                    style={{ background: memberStatus.color }}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">{currentMember.fullName}</h2>
                  <p className="text-muted-foreground text-xs mb-2">@{currentMember.username}</p>
                  <RankBadge rank={currentMember.rank} />
                </div>

                {nextRank && (
                  <div className="w-full text-left">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progreso a {nextRank}</span>
                      <span className="font-bold" style={{ color: GOLD }}>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, hsl(42,68%,38%), hsl(42,68%,58%))`,
                      }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Faltan ${Math.max(nextThreshold - totalEarnings, 0).toFixed(0)} para {nextRank}
                    </p>
                  </div>
                )}
                {!nextRank && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: GOLD }}>
                    <Shield className="w-4 h-4" />
                    <span className="font-bold">Rango máximo alcanzado</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users2, label: "Red Total", value: currentMember.totalNetwork },
                { icon: Star,   label: "Directos",  value: currentMember.directReferrals },
                { icon: TrendingUp, label: "Total ganado", value: `$${totalEarnings.toFixed(0)}` },
                { icon: Shield, label: "Membresía", value: memberStatus.label.split(" — ")[1] ?? memberStatus.label },
              ].map(({ icon: Icon, label, value }) => (
                <Card key={label} className="bg-card border-white/5">
                  <CardContent className="p-3 text-center">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{label}</div>
                    <div className="text-base font-black text-white">{value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {((currentMember.referralStatus as string) === "VENCIDO" ||
              currentMember.referralStatus === "ROJO" ||
              !currentMember.expiresAt) && (
              <Button
                className="w-full font-bold text-sm"
                style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))`, color: "#000" }}
                onClick={() => renewMembership.mutate()}
                disabled={renewMembership.isPending}
              >
                {renewMembership.isPending ? "Renovando..." : "Renovar membresía (30 días)"}
              </Button>
            )}
          </div>

          {/* Right column */}
          <div className="md:col-span-3 space-y-4">
            <Card className="bg-card border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: GOLD }} />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Mail,     label: "Correo",        value: currentMember.email },
                  { icon: Phone,    label: "Teléfono",      value: currentMember.phone ?? "No registrado" },
                  { icon: Calendar, label: "Miembro desde", value: format(new Date(currentMember.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es }) },
                  ...(currentMember.sponsorName ? [{ icon: User, label: "Patrocinador", value: `@${currentMember.sponsorName}` }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</div>
                      <div className="text-white text-sm font-medium truncate">{value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Referral code */}
            {/* Membership status */}
            <Card className="border" style={{ borderColor: `${memberStatus.color}30`, background: memberStatus.bg }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Estado de Membresía</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: memberStatus.color, boxShadow: `0 0 6px ${memberStatus.color}` }} />
                      <span className="text-base font-black" style={{ color: memberStatus.color }}>{memberStatus.label}</span>
                    </div>
                  </div>
                  {memberStatus.daysLeft > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Días restantes</p>
                      <p className="text-2xl font-black" style={{ color: memberStatus.color }}>{memberStatus.daysLeft}</p>
                    </div>
                  )}
                </div>
                {memberStatus.daysLeft > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Tu próxima recompra es en {memberStatus.daysLeft} días para mantener tu membresía activa.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: GOLD, transform: "translate(40%, -40%)" }} />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: GOLD }}>
                  <Star className="w-4 h-4" />
                  Tu Código de Referido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Comparte este código para hacer crecer tu red y ganar ingresos pasivos de tu línea descendente.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg px-4 py-3 font-mono text-lg font-black text-center tracking-[0.2em] border"
                    style={{ background: "hsl(42 68% 50% / 0.08)", borderColor: "hsl(42 68% 50% / 0.3)", color: GOLD }}>
                    {currentMember.referralCode}
                  </div>
                  <Button
                    onClick={copyReferral}
                    className="shrink-0 h-12 px-4 text-black font-bold"
                    style={{ background: `linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,56%))` }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="destructive"
              className="w-full font-bold uppercase tracking-wider h-11 text-sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
            </Button>
          </div>
        </div>
      )}



      {/* COMPRAS TAB */}
      {activeTab === "Compras" && (
        <div className="space-y-3">
          {(!purchases || (purchases as any[]).length === 0) ? (
            <Card className="bg-card border-white/5">
              <CardContent className="py-12 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground text-sm font-medium">Aún no has realizado compras.</p>
                <p className="text-muted-foreground text-xs mt-1">Visita la Tienda para adquirir productos y ganar puntos.</p>
              </CardContent>
            </Card>
          ) : (
            (purchases as any[]).map((p) => (
              <Card key={p.id} className="bg-card border-white/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "hsl(42 68% 50% / 0.12)", border: "1px solid hsl(42 68% 50% / 0.2)" }}>
                    <Package className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm">{p.productName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(p.createdAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
                      {p.quantity > 1 && ` · Qty: ${p.quantity}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black" style={{ color: GOLD }}>${Number(p.totalPrice).toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      +{Number(p.pointsEarned).toLocaleString()} pts
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Users2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
