import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Plane, Home, Car, Bike } from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

const PRIZES = [
  {
    id: 1,
    name: "Moto",
    emoji: "🏍️",
    icon: Bike,
    fracciones: 300_000,
    description: "Moto de alta gama financiada por ORODIG PTS para los mejores líderes.",
    color: "from-orange-500/20 to-amber-500/10",
    borderColor: "border-orange-500/30",
    accentColor: "#f97316",
    locked: false,
  },
  {
    id: 2,
    name: "Carro",
    emoji: "🚗",
    icon: Car,
    fracciones: 900_000,
    description: "Vehículo deportivo financiado para los líderes más destacados de la plataforma.",
    color: "from-red-500/20 to-rose-500/10",
    borderColor: "border-red-500/30",
    accentColor: "#ef4444",
    locked: false,
  },
  {
    id: 3,
    name: "Casa de Lujo",
    emoji: "🏠",
    icon: Home,
    fracciones: 2_000_000,
    description: "Casa de lujo con 1 baño, 1 cocina, 1 sala y 2 cuartos. Premio exclusivo ORODIG PTS.",
    color: "from-purple-500/20 to-violet-500/10",
    borderColor: "border-purple-500/30",
    accentColor: "#a855f7",
    locked: false,
  },
  {
    id: 4,
    name: "Viaje Exclusivo",
    emoji: "✈️",
    icon: Plane,
    fracciones: 0,
    description: "Todo gratis × 3 días y 2 noches. Incluye comidas, hospedaje, refrigerios y transporte. Será un paseo inolvidable.",
    color: "from-blue-500/20 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    accentColor: "#3b82f6",
    locked: false,
    isSpecial: true,
  },
];

const QUINCENAL_WINNERS = [
  { week: "Semana 1", name: "José Ruiz", amount: 250 },
  { week: "Semana 1", name: "María Mejía", amount: 250 },
  { week: "Semana 1", name: "Alexander López", amount: 250 },
  { week: "Semana 1", name: "Carlos Martínez", amount: 250 },
  { week: "Semana 1", name: "Miguel Cázares", amount: 250 },
  { week: "Semana 2", name: "Juan Rojas", amount: 250 },
  { week: "Semana 2", name: "Milena Vargas", amount: 250 },
  { week: "Semana 2", name: "Alexandra Sterling", amount: 250 },
  { week: "Semana 2", name: "Víctor Casanova", amount: 250 },
  { week: "Semana 2", name: "Daniel Robledo", amount: 250 },
];

export default function Premios() {
  const { currentMember } = useAuth();
  const userPoints = currentMember ? parseFloat(currentMember.points as unknown as string) : 0;

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
            <Trophy className="w-7 h-7" style={{ color: GOLD }} />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Premios & <span style={{ color: GOLD }}>Metas</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            ORODIG premia tu buen trabajo. Acumula fracciones con tu red activa y gana premios increíbles.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tus fracciones</p>
              <p className="text-3xl font-black" style={{ color: GOLD }}>{userPoints.toLocaleString("es-CO")}</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Próxima meta</p>
              <p className="text-sm font-bold text-white">
                {userPoints < 300_000 ? "Moto — 300,000 fracciones" :
                 userPoints < 900_000 ? "Carro — 900,000 fracciones" :
                 userPoints < 2_000_000 ? "Casa — 2,000,000 fracciones" : "¡Has alcanzado todos los premios!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prize cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PRIZES.map((prize) => {
          const progress = prize.fracciones > 0 ? Math.min((userPoints / prize.fracciones) * 100, 100) : 100;
          const remaining = Math.max(prize.fracciones - userPoints, 0);
          const achieved = prize.fracciones > 0 ? userPoints >= prize.fracciones : true;

          return (
            <Card key={prize.id} className={`relative overflow-hidden border bg-gradient-to-br ${prize.color} ${prize.borderColor}`}>
              {achieved && (
                <div className="absolute top-3 right-3">
                  <Badge className="text-[10px] font-black uppercase" style={{ background: prize.accentColor, color: "white" }}>
                    ¡Logrado!
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{prize.emoji}</div>
                  <div>
                    <CardTitle className="text-lg font-black text-white">{prize.name}</CardTitle>
                    {!prize.isSpecial && (
                      <p className="text-xs font-bold" style={{ color: prize.accentColor }}>
                        {prize.fracciones.toLocaleString("es-CO")} fracciones
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{prize.description}</p>

                {prize.isSpecial ? (
                  <div className="rounded-lg p-3" style={{ background: `${prize.accentColor}15`, border: `1px solid ${prize.accentColor}30` }}>
                    <p className="text-xs font-bold text-center" style={{ color: prize.accentColor }}>
                      Premio para los mejores líderes de la empresa
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                      {["Comidas", "Hospedaje", "Refrigerios", "Transporte"].map(item => (
                        <div key={item} className="text-[11px] font-semibold text-white/80 bg-white/5 rounded px-2 py-1">{item}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-bold" style={{ color: prize.accentColor }}>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" style={{ "--progress-bg": prize.accentColor } as React.CSSProperties} />
                    </div>
                    {!achieved && (
                      <p className="text-xs text-muted-foreground">
                        Te faltan <span className="font-bold text-white">{remaining.toLocaleString("es-CO")}</span> fracciones
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bono Quincenal */}
      <Card className="border" style={{ borderColor: "hsl(42 68% 50% / 0.2)", background: "linear-gradient(135deg, hsl(42,68%,10%), hsl(42,68%,6%))" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" style={{ color: GOLD }} />
            <CardTitle className="text-base font-black" style={{ color: GOLD }}>Bono Quincenal — $250 USD</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Ganadores del bono quincenal por tarea. Pagos los primeros 5 días y del 15 al 20 de cada mes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {QUINCENAL_WINNERS.map((w) => (
              <div key={w.week} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "hsl(42 68% 50% / 0.08)", border: "1px solid hsl(42 68% 50% / 0.15)" }}>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{w.week}</p>
                  <p className="text-sm font-bold text-white">{w.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{ color: GOLD }}>${w.amount}</p>
                  <p className="text-[10px] text-muted-foreground">USD</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-center text-muted-foreground">
              Los bonos se pueden reclamar en: <span className="text-white font-semibold">piedras preciosas, artículos, productos o consignación en efectivo.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How to earn fracciones */}
      <Card className="border border-white/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black text-white uppercase tracking-wider">¿Cómo ganar fracciones?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Por cada referido activo", value: "×1.5 pts" },
              { label: "Comprando paquetes", value: "Hasta 75,000 pts" },
              { label: "Bonos de liderazgo", value: "×2 pts" },
              { label: "Ingresos pasivos", value: "×1 pt" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-black" style={{ color: GOLD }}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
