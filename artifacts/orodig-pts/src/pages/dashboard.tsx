import { useState, useEffect } from "react";
import { useGetDashboardSummary, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Award, Zap, Activity, Copy, TrendingUp, ChevronRight, Gift, Layers, Diamond } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RankBadge } from "@/components/layout";
import { Link } from "wouter";

const GOLD = "hsl(42,68%,50%)";
const GOLD_HEX = "#C9911A";

const RANK_LIST = [
  "Bronce", "Cobre", "Crisolito", "Belirio Rojo", "Tanzanita Verde",
  "Plata", "Oro", "Esmeralda Azul", "Esmeralda Verde", "Diamante Azul",
  "Danzanita Verde", "Diamante Fantasía", "Zafiro Amarillo", "Alejandrita Especial", "Accionista ORODIG",
];
const RANK_THRESHOLDS: number[] = [50, 150, 350, 700, 1200, 2500, 5000, 9000, 15000, 23000, 33000, 48000, 70000, 100000, Infinity];

function getRankProgress(rank: string, totalEarnings: number) {
  const idx = RANK_LIST.indexOf(rank);
  const nextRank = idx < RANK_LIST.length - 1 ? RANK_LIST[idx + 1] : null;
  if (!nextRank) return { pct: 100, nextRank: null, needed: 0 };
  const prevThreshold = idx === 0 ? 0 : RANK_THRESHOLDS[idx - 1];
  const nextThreshold = RANK_THRESHOLDS[idx];
  const range = nextThreshold - prevThreshold;
  const progress = totalEarnings - prevThreshold;
  return {
    pct: Math.min((progress / range) * 100, 100),
    nextRank,
    needed: Math.max(nextThreshold - totalEarnings, 0),
  };
}

function MembershipCountdown({ expiresAt, referralStatus }: { expiresAt: string | null; referralStatus: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; expired: boolean }>({
    d: 0, h: 0, m: 0, s: 0, expired: true
  });

  useEffect(() => {
    if (!expiresAt || referralStatus === "ROJO") {
      setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true });
      return;
    }

    const updateTimer = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft({ d, h, m, s, expired: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, referralStatus]);

  // Color logic based on status and time remaining
  let color = "#ef4444"; // Red (Expired or ROJO)
  let glow = "rgba(239, 68, 68, 0.15)";
  let label = "Vencido / Inactivo";

  if (referralStatus === "VERDE" && !timeLeft.expired) {
    if (timeLeft.d >= 5) {
      color = "#22c55e"; // Green
      glow = "rgba(34, 197, 94, 0.15)";
      label = "Activo — Verde";
    } else {
      color = "#eab308"; // Amber/Yellow
      glow = "rgba(234, 179, 8, 0.15)";
      label = "Próximo a Vencer — Amarillo";
    }
  } else if (referralStatus === "SUSPENDIDO") {
    color = "#6b7280"; // Gray
    glow = "rgba(107, 114, 128, 0.15)";
    label = "Suspendido";
  }

  return (
    <Card className="border relative overflow-hidden backdrop-blur-md bg-white/[0.02]" style={{ borderColor: `${color}30`, boxShadow: `0 0 20px ${glow}` }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15" style={{ background: color, transform: "translate(20%, -20%)" }} />
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Estado de Membresía</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-sm font-black" style={{ color }}>{label}</span>
            </div>
            {referralStatus === "VERDE" && !timeLeft.expired && (
              <p className="text-xs text-muted-foreground mt-1">Disfrutando de los beneficios de referidos.</p>
            )}
          </div>
          
          <div className="flex flex-col items-start sm:items-end">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Tiempo de Recompra</p>
            {timeLeft.expired ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-red-500 mr-2">Expirado</span>
                <Link href="/plan">
                  <button className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95">
                    Renovar
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1 font-mono">
                {[
                  { value: timeLeft.d, label: "d" },
                  { value: timeLeft.h, label: "h" },
                  { value: timeLeft.m, label: "m" },
                  { value: timeLeft.s, label: "s" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-baseline">
                    <span className="text-xl sm:text-2xl font-black" style={{ color }}>
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-0.5 mr-2">{item.label}</span>
                  </div>
                ))}
                {timeLeft.d < 5 && (
                  <Link href="/plan">
                    <button className="ml-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95">
                      Renovar
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "¡Buenos días";
  if (h < 19) return "¡Buenas tardes";
  return "¡Buenas noches";
}

export default function Dashboard() {
  const { currentMember } = useAuth();
  const { toast } = useToast();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity();

  if (isSummaryLoading || isActivityLoading || !summary || !currentMember) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5" />)}
      </div>
    );
  }

  const { pct, nextRank, needed } = getRankProgress(currentMember.rank, summary.totalEarnings);

  const pieData = [
    { name: "Referidos",  value: summary.earningsByType.referral,   color: GOLD_HEX },
    { name: "Ventas",     value: summary.earningsByType.sales,       color: "#8B00FF" },
    { name: "Compras",    value: summary.earningsByType.purchases,   color: "#00CC66" },
    { name: "Liderazgo",  value: summary.earningsByType.leadership,  color: "#00CCFF" },
    { name: "Trabajo",    value: summary.earningsByType.work,        color: "#FF44AA" },
    { name: "Pasivo",     value: summary.earningsByType.passive,     color: "#FF6600" },
  ].filter(d => d.value > 0);

  const copyReferral = () => {
    navigator.clipboard.writeText(currentMember.referralCode);
    toast({ title: "¡Copiado!", description: "Código de referido copiado al portapapeles." });
  };

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getGreeting()}, <span style={{ color: GOLD }}>{currentMember.fullName.split(" ")[0]}</span>!
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <RankBadge rank={currentMember.rank} />
            <span className="text-muted-foreground text-sm">· {currentMember.totalNetwork} miembros en tu red</span>
          </div>
        </div>
        <button
          onClick={copyReferral}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all hover:opacity-80 self-start sm:self-auto"
          style={{ borderColor: "hsl(42 68% 50% / 0.4)", color: GOLD, background: "hsl(42 68% 50% / 0.08)" }}
        >
          <Copy className="w-4 h-4" />
          <span className="font-mono tracking-widest">{currentMember.referralCode}</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Saldo",       value: `$${summary.balance.toFixed(2)}`,       icon: DollarSign, color: GOLD,      glow: "hsl(42 68% 50% / 0.15)" },
          { label: "Puntos",      value: summary.points.toLocaleString("es"),     icon: Zap,         color: "#8B00FF",  glow: "rgba(139,0,255,0.1)" },
          { label: "Total ganado",value: `$${summary.totalEarnings.toFixed(2)}`, icon: Award,        color: "#00CCFF",  glow: "rgba(0,204,255,0.1)" },
          { label: "Tu red",      value: summary.totalNetwork,                   icon: Users,        color: "#00CC66",  glow: "rgba(0,204,102,0.1)" },
        ].map(({ label, value, icon: Icon, color, glow }) => (
          <Card key={label} className="bg-card border-white/5 overflow-hidden relative" style={{ boxShadow: `0 0 20px ${glow}` }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-30" style={{ background: color, transform: "translate(30%, -30%)" }} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl sm:text-2xl font-black" style={{ color }}>{value}</div>
              {label === "Tu red" && (
                <p className="text-xs text-muted-foreground">{summary.directReferrals} directos</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Membership status + Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MembershipCountdown
          expiresAt={(currentMember as any).expiresAt ?? null}
          referralStatus={(currentMember as any).referralStatus || "ROJO"}
        />

        {/* Quick nav cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/rangos",  icon: Diamond, label: "Rangos", color: "hsl(42,68%,50%)" },
            { href: "/premios", icon: Gift,    label: "Premios", color: "#f97316" },
            { href: "/plan",    icon: Layers,  label: "Plan", color: "#8b5cf6" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all cursor-pointer text-center h-full">
                <Icon className="w-5 h-5" style={{ color }} />
                <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Rank progress */}
      {nextRank && (
        <Card className="bg-card border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
                <span className="text-sm font-bold text-white">Progreso de Rango</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RankBadge rank={currentMember.rank} />
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <RankBadge rank={nextRank} />
              </div>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, hsl(42,68%,38%), hsl(42,68%,58%))`,
                  boxShadow: `0 0 8px ${GOLD}80`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{pct.toFixed(0)}% completado</span>
              <span>Faltan <span className="font-bold text-white">${needed.toFixed(0)}</span> para {nextRank}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ganancias Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyEarnings} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#222", fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Ganancias"]}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}
                    fill="url(#goldGrad)" />
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(42,68%,58%)" />
                      <stop offset="100%" stopColor="hsl(42,68%,36%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-card border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desglose por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="h-[160px] relative">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#222", fontSize: 11, borderRadius: 8 }}
                        formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-base font-black text-white">${summary.totalEarnings >= 1000 ? (summary.totalEarnings/1000).toFixed(1)+"k" : summary.totalEarnings.toFixed(0)}</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Sin ganancias aún</div>
              )}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-1 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card className="bg-card border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4" style={{ color: GOLD }} />
              Actividad Reciente
            </CardTitle>
            <Link href="/earnings" className="text-xs text-muted-foreground hover:text-white transition-colors">Ver todo →</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {activity && activity.length > 0 ? activity.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "d MMM yyyy · HH:mm", { locale: es })}</p>
                  </div>
                </div>
                {item.amount > 0 && (
                  <div className="font-black text-green-400 shrink-0 text-sm">+${item.amount.toFixed(2)}</div>
                )}
              </div>
            )) : (
              <div className="text-center p-8 text-muted-foreground text-sm">Sin actividad reciente</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
