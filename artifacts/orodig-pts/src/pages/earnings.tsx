import { useListEarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History } from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  referral: "Referidos",
  sales: "Ventas",
  purchases: "Compras",
  leadership: "Liderazgo",
  work: "Trabajo",
  passive: "Pasivo",
};

const ESTADO_LABELS: Record<string, string> = {
  paid: "Pagado",
  confirmed: "Confirmado",
  pending: "Pendiente",
};

export default function Earnings() {
  const { data: earnings, isLoading } = useListEarnings();

  if (isLoading) {
    return <div className="text-primary font-bold animate-pulse pt-4">Cargando historial...</div>;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "referral": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "sales": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "purchases": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "leadership": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "work": return "bg-pink-500/20 text-pink-400 border-pink-500/50";
      case "passive": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-green-400";
      case "confirmed": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">HISTORIAL DE GANANCIAS</h1>
        <p className="text-muted-foreground text-sm">Cada centavo de tu generación de riqueza.</p>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <History className="w-4 h-4 text-primary" />
            Historial de Transacciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-border/50">
            {earnings && earnings.length > 0 ? earnings.map((earning) => (
              <div key={earning.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className={`uppercase text-[9px] font-bold tracking-wider shrink-0 ${getTypeColor(earning.type)}`}>
                    {TIPO_LABELS[earning.type] ?? earning.type}
                  </Badge>
                  <span className="font-black text-white">${earning.amount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-white font-medium">{earning.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{format(new Date(earning.createdAt), "d MMM yyyy", { locale: es })}</span>
                  <span className={`uppercase font-bold ${getStatusColor(earning.status)}`}>{ESTADO_LABELS[earning.status] ?? earning.status}</span>
                </div>
              </div>
            )) : (
              <div className="text-center p-8 text-muted-foreground text-sm">Sin ganancias registradas aún.</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-md border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background/50">
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 font-bold text-muted-foreground">Fecha</th>
                  <th className="text-left p-3 font-bold text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 font-bold text-muted-foreground">Descripción</th>
                  <th className="text-left p-3 font-bold text-muted-foreground">Estado</th>
                  <th className="text-right p-3 font-bold text-muted-foreground">Monto</th>
                </tr>
              </thead>
              <tbody>
                {earnings && earnings.length > 0 ? earnings.map((earning) => (
                  <tr key={earning.id} className="border-b border-border/30 hover:bg-background/50 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{format(new Date(earning.createdAt), "d MMM yyyy", { locale: es })}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`uppercase text-[9px] font-bold tracking-wider ${getTypeColor(earning.type)}`}>
                        {TIPO_LABELS[earning.type] ?? earning.type}
                      </Badge>
                    </td>
                    <td className="p-3 text-white font-medium max-w-[200px] truncate">{earning.description}</td>
                    <td className="p-3">
                      <span className={`text-xs uppercase font-bold ${getStatusColor(earning.status)}`}>
                        {ESTADO_LABELS[earning.status] ?? earning.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-white">${earning.amount.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">Sin ganancias registradas aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
