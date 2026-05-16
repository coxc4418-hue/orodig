import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/layout";
import { Mail, Phone, Calendar, Copy, LogOut, User, Star, TrendingUp, Shield } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@workspace/api-client-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";

const GOLD = "hsl(42,68%,50%)";

const RANKS = ["Bronce", "Plata", "Oro", "Platino", "Diamante", "Embajador"];
const RANK_NEXT: Record<string, string | null> = {
  Bronce: "Plata", Plata: "Oro", Oro: "Platino", Platino: "Diamante", Diamante: "Embajador", Embajador: null,
};
const RANK_THRESHOLDS: Record<string, number> = {
  Bronce: 500, Plata: 2000, Oro: 5000, Platino: 15000, Diamante: 45000, Embajador: Infinity,
};

export default function Profile() {
  const { currentMember, logout } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();
  const { data: summary } = useGetDashboardSummary();

  if (!currentMember) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(currentMember.referralCode);
    toast({ title: "¡Copiado!", description: "Código de referido copiado al portapapeles" });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => logout() });
  };

  const nextRank = RANK_NEXT[currentMember.rank];
  const totalEarnings = summary?.totalEarnings ?? 0;
  const currentIdx = RANKS.indexOf(currentMember.rank);
  const prevThreshold = currentIdx === 0 ? 0 : RANK_THRESHOLDS[RANKS[currentIdx - 1]];
  const nextThreshold = RANK_THRESHOLDS[currentMember.rank];
  const progress = nextRank
    ? Math.min(((totalEarnings - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100)
    : 100;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI PERFIL</h1>
        <p className="text-muted-foreground text-sm">Tu identidad y estadísticas en la red.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {/* Left column */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card border-white/5 text-center py-6">
            <CardContent className="px-4 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-black"
                  style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
                  {currentMember.fullName.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{currentMember.fullName}</h2>
                <p className="text-muted-foreground text-xs mb-2">@{currentMember.username}</p>
                <RankBadge rank={currentMember.rank} />
              </div>

              {/* Rank progress */}
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
              { icon: Users2, label: "Red Total",    value: currentMember.totalNetwork },
              { icon: Star,   label: "Directos",     value: currentMember.directReferrals },
              { icon: TrendingUp, label: "Total ganado", value: `$${totalEarnings.toFixed(0)}` },
              { icon: Shield, label: "Estado",        value: "Activo" },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label} className="bg-card border-white/5">
                <CardContent className="p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{label}</div>
                  <div className="text-base font-black text-white">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                { icon: Mail,     label: "Correo",      value: currentMember.email },
                { icon: Phone,    label: "Teléfono",    value: currentMember.phone ?? "No registrado" },
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

          {/* Logout */}
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
