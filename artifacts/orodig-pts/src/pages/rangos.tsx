import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Diamond, CheckCircle2, Lock } from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

const RANGOS = [
  {
    rank: "Bronce",
    requirement: "Vender 1 suscripción",
    bonus: 12,
    color: "#cd7f32",
    gemoji: "🪨",
    prize: "Detalle sorpresa de la empresa",
  },
  {
    rank: "Cobre",
    requirement: "Vender 2 suscripciones",
    bonus: 15,
    color: "#b87333",
    gemoji: "🟫",
    prize: "1 paquete Recetas del Éxito",
  },
  {
    rank: "Crisolito",
    requirement: "Vender 4 suscripciones",
    bonus: 18,
    color: "#a8c090",
    gemoji: "💚",
    prize: "2 paquetes Recetas del Éxito",
  },
  {
    rank: "Belirio Rojo",
    requirement: "Vender 8 suscripciones",
    bonus: 20,
    color: "#dc2626",
    gemoji: "🔴",
    prize: "3 paquetes Recetas del Éxito",
  },
  {
    rank: "Tanzanita Verde",
    requirement: "Vender 10 suscripciones",
    bonus: 24,
    color: "#14b8a6",
    gemoji: "💎",
    prize: "Acceso a entrenamiento especial",
  },
  {
    rank: "Plata",
    requirement: "Vender 5 paquetes Pequeño Aprendiz",
    bonus: 30,
    color: "#94a3b8",
    gemoji: "🥈",
    prize: "Kit Plata de bienvenida",
  },
  {
    rank: "Oro",
    requirement: "Vender 10 paquetes Pequeño Aprendiz",
    bonus: 40,
    color: "hsl(42,68%,50%)",
    gemoji: "🥇",
    prize: "Kit Oro de bienvenida",
  },
  {
    rank: "Esmeralda Azul",
    requirement: "Vender 1 paquete Mediano Liderazgo",
    bonus: 50,
    color: "#60a5fa",
    gemoji: "💠",
    prize: "Entrenamiento director de líderes",
  },
  {
    rank: "Esmeralda Verde",
    requirement: "Vender 1 paquete Gran Líder",
    bonus: 60,
    color: "#34d399",
    gemoji: "💚",
    prize: "Entrenamiento Gran Líder",
  },
  {
    rank: "Diamante Azul",
    requirement: "Vender 1 paquete Director de Líderes",
    bonus: 70,
    color: "#38bdf8",
    gemoji: "🔷",
    prize: "Título Director de Líderes",
  },
  {
    rank: "Danzanita Verde",
    requirement: "Superar Director de Líderes",
    bonus: 80,
    color: "#4ade80",
    gemoji: "🌿",
    prize: "Reconocimiento especial",
  },
  {
    rank: "Diamante Fantasía",
    requirement: "Vender 1 paquete Director de Directores",
    bonus: 80,
    color: "#a78bfa",
    gemoji: "🌈",
    prize: "Título Director de Directores",
  },
  {
    rank: "Zafiro Amarillo",
    requirement: "Vender 1 paquete Director de Zonas",
    bonus: 100,
    color: "#fbbf24",
    gemoji: "💛",
    prize: "Título Director de Zonas",
  },
  {
    rank: "Alejandrita Especial",
    requirement: "Vender 1 paquete Director de Países",
    bonus: 120,
    color: "#c084fc",
    gemoji: "💜",
    prize: "Apertura en otro país",
  },
  {
    rank: "Accionista ORODIG",
    requirement: "Vender todos los paquetes ORODIG PTS",
    bonus: 200,
    color: "hsl(42,68%,50%)",
    gemoji: "👑",
    prize: "Accionista de la empresa",
  },
];

const RANK_ORDER = RANGOS.map(r => r.rank);

export default function Rangos() {
  const { currentMember } = useAuth();
  const currentRankIdx = RANK_ORDER.indexOf(currentMember?.rank ?? "Bronce");

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
            <Diamond className="w-7 h-7" style={{ color: GOLD }} />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Rangos <span style={{ color: GOLD }}>Mineros ORODIG</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Sistema de 15 rangos. Avanza vendiendo paquetes y gana más por cada referido directo.
          </p>
          {currentMember && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "hsl(42 68% 50% / 0.15)", border: "1px solid hsl(42 68% 50% / 0.3)" }}>
              <span className="text-xs text-muted-foreground">Tu rango actual:</span>
              <span className="text-sm font-black" style={{ color: GOLD }}>{currentMember.rank}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rangos list */}
      <div className="space-y-3">
        {RANGOS.map((rango, i) => {
          const isAchieved = i <= currentRankIdx;
          const isCurrent = i === currentRankIdx;

          return (
            <Card key={rango.rank} className={`border transition-all ${isCurrent ? "scale-[1.01]" : ""}`}
              style={{
                borderColor: isCurrent ? rango.color : isAchieved ? `${rango.color}30` : "hsl(0 0% 100% / 0.05)",
                background: isCurrent
                  ? `linear-gradient(135deg, ${rango.color}15, ${rango.color}08)`
                  : isAchieved ? "hsl(0 0% 100% / 0.02)" : "transparent",
                opacity: !isAchieved && !isCurrent ? 0.6 : 1
              }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Number + gem */}
                  <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                    <span className="text-2xl">{rango.gemoji}</span>
                    <span className="text-[10px] font-black text-muted-foreground">#{i + 1}</span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-base font-black" style={{ color: isCurrent || isAchieved ? rango.color : "hsl(240,5%,55%)" }}>
                        {rango.rank}
                      </span>
                      {isCurrent && <Badge className="text-[9px] font-black uppercase px-1.5 py-0" style={{ background: rango.color, color: "black" }}>Tu rango</Badge>}
                      {isAchieved && !isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                      {!isAchieved && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rango.requirement}</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: `${rango.color}15`, color: rango.color }}>
                        ${rango.bonus} USD / referido
                      </div>
                      {rango.prize && (
                        <div className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/5 text-muted-foreground">
                          🎁 {rango.prize}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="p-4 rounded-2xl" style={{ background: "hsl(42 68% 50% / 0.06)", border: "1px solid hsl(42 68% 50% / 0.15)" }}>
        <p className="text-xs text-center text-muted-foreground">
          Los bonos se pueden <span className="text-white font-semibold">retirar o guardar en bóveda</span> (piedras preciosas, artículos, productos o consignación en efectivo).
        </p>
      </div>
    </div>
  );
}
