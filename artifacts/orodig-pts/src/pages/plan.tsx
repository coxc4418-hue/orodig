import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Users, TrendingUp, Info } from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

const PACKAGES = [
  { name: "Suscripción", price: 36, bonus1: 12, color: "#6b7280" },
  { name: "Pequeño Aprendiz", price: 150, bonus1: 13, color: "#f59e0b" },
  { name: "Mediano Liderazgo", price: 250, bonus1: 14, color: "#10b981" },
  { name: "Gran Líder", price: 550, bonus1: 15, color: "#3b82f6" },
  { name: "Director de Líderes", price: 850, bonus1: 15, color: "#8b5cf6" },
  { name: "Director de Directores", price: 1100, bonus1: 15, color: "#ec4899" },
  { name: "Director de Zonas", price: 1700, bonus1: 16, color: "#f97316" },
  { name: "Director de Países", price: 6200, bonus1: 17, color: "#ef4444" },
];

const LEVELS = [
  { nivel: "Nivel 1 (directos)", desc: "Bono directo por referido según paquete vendido", pct: "Fijo USD" },
  { nivel: "Nivel 2", desc: "8% de lo que genere tu nivel 2", pct: "8%" },
  { nivel: "Nivel 3", desc: "5% de lo que genere tu nivel 3", pct: "5%" },
  { nivel: "Niveles 4–5", desc: "÷6 de lo que generen los niveles 4 y 5", pct: "÷6" },
  { nivel: "Niveles 6–8", desc: "÷3 de lo que generen los niveles 6, 7 y 8", pct: "÷3" },
  { nivel: "Niveles 9–10", desc: "÷2 de lo que generen los niveles 9 y 10", pct: "÷2" },
  { nivel: "Niveles 11–50", desc: "÷1 de lo que genere cada nivel hasta el 50", pct: "÷1" },
];

const RANKS_BONUS = [
  { rank: "Tanzanita Verde", bonus: 24, color: "#14b8a6" },
  { rank: "Plata", bonus: 30, color: "#94a3b8" },
  { rank: "Oro", bonus: 40, color: "hsl(42,68%,50%)" },
  { rank: "Esmeralda Azul", bonus: 50, color: "#60a5fa" },
  { rank: "Esmeralda Verde", bonus: 60, color: "#34d399" },
  { rank: "Diamante Azul", bonus: 70, color: "#38bdf8" },
  { rank: "Danzanita Verde", bonus: 80, color: "#4ade80" },
  { rank: "Diamante Fantasía", bonus: 80, color: "#a78bfa" },
  { rank: "Zafiro Amarillo", bonus: 100, color: "#fbbf24" },
  { rank: "Alejandrita Especial", bonus: 120, color: "#c084fc" },
  { rank: "Accionista ORODIG", bonus: 200, color: "hsl(42,68%,50%)" },
];

const PAYMENT_DATES = [
  "Primeros 5 días de cada mes",
  "Del 15 al 20 de cada mes",
];

export default function Plan() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{
        background: "linear-gradient(135deg, hsl(42,68%,12%), hsl(42,68%,6%))",
        border: "1px solid hsl(42 68% 50% / 0.2)"
      }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 80% 50%, hsl(42,68%,50%), transparent 50%)"
        }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-7 h-7" style={{ color: GOLD }} />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Plan de <span style={{ color: GOLD }}>Compensación</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Gana comisiones de toda tu red hasta el nivel 50. Mientras más activos sean tus referidos, más ganas tú.
          </p>
        </div>
      </div>

      {/* Paquetes y bono directo */}
      <Card className="border" style={{ borderColor: "hsl(42 68% 50% / 0.15)" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
            <CardTitle className="text-sm font-black uppercase tracking-wider text-white">Bono por Referido Directo (Nivel 1)</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Por cada persona que refieras y compre uno de estos paquetes:</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PACKAGES.map((pkg) => (
              <div key={pkg.name} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: pkg.color }} />
                  <div>
                    <p className="text-sm font-bold text-white">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">${pkg.price.toLocaleString()} USD</p>
                  </div>
                </div>
                <Badge className="text-sm font-black px-3 py-1" style={{ background: `${pkg.color}20`, color: pkg.color, border: `1px solid ${pkg.color}40` }}>
                  ${pkg.bonus1} USD
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Niveles 1-50 */}
      <Card className="border border-white/8">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: GOLD }} />
            <CardTitle className="text-sm font-black uppercase tracking-wider text-white">Comisiones por Niveles (Red)</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Ganas de TODAS las personas activas hasta el nivel 50 de tu red.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LEVELS.map((level, i) => (
              <div key={level.nivel} className="flex items-center gap-3 p-3 rounded-xl" style={{
                background: i === 0 ? "hsl(42 68% 50% / 0.08)" : "hsl(0 0% 100% / 0.02)",
                border: i === 0 ? "1px solid hsl(42 68% 50% / 0.2)" : "1px solid hsl(0 0% 100% / 0.05)"
              }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: i === 0 ? "hsl(42 68% 50% / 0.2)" : "hsl(0 0% 100% / 0.05)", color: i === 0 ? GOLD : "hsl(240,5%,65%)" }}>
                  {level.pct}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white">{level.nivel}</p>
                  <p className="text-[11px] text-muted-foreground">{level.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl" style={{ background: "hsl(42 68% 50% / 0.05)", border: "1px solid hsl(42 68% 50% / 0.15)" }}>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
              <p className="text-xs text-muted-foreground">
                Puedes vincular personas de forma <span className="text-white font-semibold">infinita</span> hacia la derecha o la izquierda. Cualquiera de tus directos, o personas debajo de tus directos, pueden expandir la red y generarte ganancias increíbles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus por Rango */}
      <Card className="border border-white/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-white">
            Valor del Bono por Rango
          </CardTitle>
          <p className="text-xs text-muted-foreground">Mientras más alto tu rango, más ganas por cada referido directo.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {RANKS_BONUS.map((r) => (
              <div key={r.rank} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                  <span className="text-sm font-bold text-white">{r.rank}</span>
                </div>
                <span className="text-sm font-black" style={{ color: r.color }}>${r.bonus} USD/referido</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fechas de Pago */}
      <Card className="border border-white/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-white">Fechas de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_DATES.map((date) => (
              <div key={date} className="p-4 rounded-xl text-center" style={{
                background: "hsl(42 68% 50% / 0.08)",
                border: "1px solid hsl(42 68% 50% / 0.2)"
              }}>
                <p className="text-sm font-bold text-white">{date}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-center text-muted-foreground">
              Los bonos se pueden reclamar en: <span className="text-white font-semibold">piedras preciosas, artículos, productos o consignación en efectivo</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Roles */}
      <Card className="border border-white/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-white">Roles en la Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Patrocinador", desc: "Persona que te inscribió a la plataforma.", color: "#f59e0b" },
              { title: "Líder Motivador", desc: "Persona(s) que te motiva a seguir siendo parte de la plataforma.", color: "#10b981" },
              { title: "Líder Distribuidor", desc: "Persona(s) encargada(s) de la logística y almacenamiento de los pedidos.", color: "#3b82f6" },
            ].map((role) => (
              <div key={role.title} className="p-3 rounded-xl bg-white/3 border border-white/5">
                <p className="text-sm font-black" style={{ color: role.color }}>{role.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
