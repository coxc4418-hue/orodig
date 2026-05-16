import { useGetDashboardSummary, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Award, Zap, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TIPO_LABELS: Record<string, string> = {
  referral: "Referidos",
  sales: "Ventas",
  purchases: "Compras",
  leadership: "Liderazgo",
  work: "Trabajo",
  passive: "Pasivo",
};

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity();

  if (isSummaryLoading || isActivityLoading) {
    return <div className="text-primary font-bold animate-pulse pt-4">Cargando panel principal...</div>;
  }

  if (!summary) return null;

  const pieData = [
    { name: "Referidos", value: summary.earningsByType.referral, color: "#FFD700" },
    { name: "Ventas", value: summary.earningsByType.sales, color: "#8B00FF" },
    { name: "Compras", value: summary.earningsByType.purchases, color: "#00FF00" },
    { name: "Liderazgo", value: summary.earningsByType.leadership, color: "#00FFFF" },
    { name: "Trabajo", value: summary.earningsByType.work, color: "#FF00FF" },
    { name: "Pasivo", value: summary.earningsByType.passive, color: "#FF4500" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">PANEL PRINCIPAL</h1>
        <p className="text-muted-foreground text-sm">Tu resumen de generación de riqueza.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/20 shadow-[0_0_15px_rgba(255,215,0,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
              ${summary.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Puntos</CardTitle>
            <Zap className="h-4 w-4 text-purple-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-black text-purple-400">{summary.points}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Ganado</CardTitle>
            <Award className="h-4 w-4 text-cyan-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-black text-cyan-400">${summary.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Red Total</CardTitle>
            <Users className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-black text-green-400">{summary.totalNetwork}</div>
            <p className="text-xs text-muted-foreground">{summary.directReferrals} directos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Ganancias Mensuales</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pr-2">
            <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyEarnings}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#333", fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Ganancias"]}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Desglose de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[280px] relative">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#333", fontSize: 12 }}
                        formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-lg font-black text-white">${summary.totalEarnings.toFixed(0)}</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Zap className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Sin ganancias aún</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Activity className="w-4 h-4 text-primary" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activity && activity.length > 0 ? activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(255,215,0,0.8)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: es })}</p>
                  </div>
                </div>
                {item.amount > 0 && (
                  <div className="font-black text-green-400 shrink-0 text-sm">+${item.amount.toFixed(2)}</div>
                )}
              </div>
            )) : (
              <div className="text-center p-6 text-muted-foreground text-sm">Sin actividad reciente</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
