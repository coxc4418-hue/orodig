import { useListEarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, TrendingUp } from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  referral:   { label: "Referidos",  color: GOLD,        bg: "hsl(42 68% 50% / 0.15)" },
  sales:      { label: "Ventas",     color: "#9933FF",   bg: "rgba(153,51,255,0.12)" },
  purchases:  { label: "Compras",    color: "#00CC66",   bg: "rgba(0,204,102,0.12)" },
  leadership: { label: "Liderazgo",  color: "#00CCFF",   bg: "rgba(0,204,255,0.12)" },
  work:       { label: "Trabajo",    color: "#FF44AA",   bg: "rgba(255,68,170,0.12)" },
  passive:    { label: "Pasivo",     color: "#FF6600",   bg: "rgba(255,102,0,0.12)" },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  paid:      { label: "Pagado",     color: "#00CC66" },
  confirmed: { label: "Confirmado", color: GOLD },
  pending:   { label: "Pendiente",  color: "#888" },
};

export default function Earnings() {
  const { data: earnings, isLoading } = useListEarnings();

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  const total = earnings?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const byType = earnings?.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">HISTORIAL DE GANANCIAS</h1>
        <p className="text-muted-foreground text-sm">Registro completo de todos tus ingresos.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(TIPO_CONFIG).map(([type, cfg]) => (
          <Card key={type} className="bg-card border-white/5 text-center">
            <CardContent className="p-3">
              <div className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="text-sm font-black text-white">${(byType[type] ?? 0).toFixed(0)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="w-4 h-4" style={{ color: GOLD }} />
              Todas las Transacciones
            </CardTitle>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="font-black text-white">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-white/5">
            {earnings && earnings.length > 0 ? earnings.map((earning) => {
              const cfg = TIPO_CONFIG[earning.type] ?? { label: earning.type, color: "#888", bg: "rgba(136,136,136,0.1)" };
              const sCfg = ESTADO_CONFIG[earning.status] ?? { label: earning.status, color: "#888" };
              return (
                <div key={earning.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    <span className="font-black text-white">${earning.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-white">{earning.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{format(new Date(earning.createdAt), "d MMM yyyy", { locale: es })}</span>
                    <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: sCfg.color }}>{sCfg.label}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center p-8 text-muted-foreground text-sm">Sin ganancias aún.</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción</th>
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {earnings && earnings.length > 0 ? earnings.map((earning) => {
                  const cfg = TIPO_CONFIG[earning.type] ?? { label: earning.type, color: "#888", bg: "rgba(136,136,136,0.1)" };
                  const sCfg = ESTADO_CONFIG[earning.status] ?? { label: earning.status, color: "#888" };
                  return (
                    <tr key={earning.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(earning.createdAt), "d MMM yyyy", { locale: es })}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-white max-w-[220px] truncate">{earning.description}</td>
                      <td className="p-3">
                        <span className="text-[10px] uppercase font-black tracking-wider" style={{ color: sCfg.color }}>{sCfg.label}</span>
                      </td>
                      <td className="p-3 text-right font-black text-white">${earning.amount.toFixed(2)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">Sin ganancias registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
