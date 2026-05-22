import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Diamond, Lock } from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

// CSS Gemstone component for ranks without real images
function CSSGemstone({ color, secondaryColor, style: gemStyle }: { color: string; secondaryColor: string; style?: string }) {
  return (
    <div className="gem-container" style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `
          radial-gradient(ellipse at 30% 20%, ${secondaryColor}cc 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, ${color}99 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, ${color} 0%, ${secondaryColor} 60%, ${color}88 100%)
        `,
      }} />
      {/* Facet overlay */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `conic-gradient(
          from 0deg,
          transparent 0deg, rgba(255,255,255,0.08) 30deg,
          transparent 60deg, rgba(255,255,255,0.05) 90deg,
          transparent 120deg, rgba(255,255,255,0.1) 150deg,
          transparent 180deg, rgba(255,255,255,0.03) 210deg,
          transparent 240deg, rgba(255,255,255,0.07) 270deg,
          transparent 300deg, rgba(255,255,255,0.04) 330deg,
          transparent 360deg
        )`,
      }} />
      {/* Highlight / light refraction */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `
          radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 20%, transparent 50%),
          radial-gradient(ellipse at 65% 75%, rgba(255,255,255,0.15) 0%, transparent 30%)
        `,
      }} />
      {/* Inner sparkle dots */}
      <div className="gem-sparkle" style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `
          radial-gradient(circle at 28% 32%, rgba(255,255,255,0.7) 0%, transparent 3%),
          radial-gradient(circle at 62% 22%, rgba(255,255,255,0.5) 0%, transparent 2%),
          radial-gradient(circle at 72% 65%, rgba(255,255,255,0.4) 0%, transparent 2.5%),
          radial-gradient(circle at 40% 70%, rgba(255,255,255,0.3) 0%, transparent 2%)
        `,
      }} />
    </div>
  );
}

// Map of gemstone image paths (real photos for those generated, CSS for others)
const GEM_CONFIG: Record<string, { image?: string; color: string; secondary: string; glowColor: string }> = {
  "Bronce":              { image: "/gems/bronce.png",          color: "#cd7f32", secondary: "#8b5a2b", glowColor: "#cd7f32" },
  "Cobre":               { image: "/gems/cobre.png",           color: "#b87333", secondary: "#6d4c2a", glowColor: "#b87333" },
  "Crisolito":           { image: "/gems/crisolito.png",       color: "#a8c090", secondary: "#6b8e23", glowColor: "#8bab72" },
  "Belirio Rojo":        { image: "/gems/belirio_rojo.png",    color: "#dc2626", secondary: "#7f1d1d", glowColor: "#ef4444" },
  "Tanzanita Verde":     { image: "/gems/tanzanita_verde.png", color: "#14b8a6", secondary: "#0d6e63", glowColor: "#2dd4bf" },
  "Plata":               { color: "#94a3b8", secondary: "#64748b", glowColor: "#cbd5e1" },
  "Oro":                 { color: "#d4a017", secondary: "#8b6914", glowColor: "#fbbf24" },
  "Esmeralda Azul":      { color: "#3b82f6", secondary: "#1e3a5f", glowColor: "#60a5fa" },
  "Esmeralda Verde":     { color: "#10b981", secondary: "#064e3b", glowColor: "#34d399" },
  "Diamante Azul":       { color: "#38bdf8", secondary: "#0c4a6e", glowColor: "#7dd3fc" },
  "Danzanita Verde":     { color: "#22c55e", secondary: "#166534", glowColor: "#4ade80" },
  "Diamante Fantasía":   { color: "#a855f7", secondary: "#581c87", glowColor: "#c084fc" },
  "Zafiro Amarillo":     { color: "#eab308", secondary: "#854d0e", glowColor: "#fcd34d" },
  "Alejandrita Especial":{ color: "#a855f7", secondary: "#6b21a8", glowColor: "#d8b4fe" },
  "Accionista ORODIG":   { color: "#d4a017", secondary: "#92400e", glowColor: "#fbbf24" },
};

const RANGOS = [
  {
    rank: "Bronce",
    requirement: "Vender 1 suscripción",
    bonus: 12,
    color: "#cd7f32",
    prize: "Detalle sorpresa de la empresa",
  },
  {
    rank: "Cobre",
    requirement: "Vender 2 suscripciones",
    bonus: 15,
    color: "#b87333",
    prize: "1 paquete Recetas del Éxito",
  },
  {
    rank: "Crisolito",
    requirement: "Vender 4 suscripciones",
    bonus: 18,
    color: "#a8c090",
    prize: "2 paquetes Recetas del Éxito",
  },
  {
    rank: "Belirio Rojo",
    requirement: "Vender 8 suscripciones",
    bonus: 20,
    color: "#dc2626",
    prize: "3 paquetes Recetas del Éxito",
  },
  {
    rank: "Tanzanita Verde",
    requirement: "Vender 10 suscripciones",
    bonus: 24,
    color: "#14b8a6",
    prize: "Acceso a entrenamiento especial",
  },
  {
    rank: "Plata",
    requirement: "Vender 5 paquetes Pequeño Aprendiz",
    bonus: 30,
    color: "#94a3b8",
    prize: "Kit Plata de bienvenida",
  },
  {
    rank: "Oro",
    requirement: "Vender 10 paquetes Pequeño Aprendiz",
    bonus: 40,
    color: "hsl(42,68%,50%)",
    prize: "Kit Oro de bienvenida",
  },
  {
    rank: "Esmeralda Azul",
    requirement: "Vender 1 paquete Mediano Liderazgo",
    bonus: 50,
    color: "#60a5fa",
    prize: "Entrenamiento director de líderes",
  },
  {
    rank: "Esmeralda Verde",
    requirement: "Vender 1 paquete Gran Líder",
    bonus: 60,
    color: "#34d399",
    prize: "Entrenamiento Gran Líder",
  },
  {
    rank: "Diamante Azul",
    requirement: "Vender 1 paquete Director de Líderes",
    bonus: 70,
    color: "#38bdf8",
    prize: "Título Director de Líderes",
  },
  {
    rank: "Danzanita Verde",
    requirement: "Superar Director de Líderes",
    bonus: 80,
    color: "#4ade80",
    prize: "Reconocimiento especial",
  },
  {
    rank: "Diamante Fantasía",
    requirement: "Vender 1 paquete Director de Directores",
    bonus: 80,
    color: "#a78bfa",
    prize: "Título Director de Directores",
  },
  {
    rank: "Zafiro Amarillo",
    requirement: "Vender 1 paquete Director de Zonas",
    bonus: 100,
    color: "#fbbf24",
    prize: "Título Director de Zonas",
  },
  {
    rank: "Alejandrita Especial",
    requirement: "Vender 1 paquete Director de Países",
    bonus: 120,
    color: "#c084fc",
    prize: "Apertura en otro país",
  },
  {
    rank: "Accionista ORODIG",
    requirement: "Vender todos los paquetes ORODIG PTS",
    bonus: 200,
    color: "hsl(42,68%,50%)",
    prize: "Accionista de la empresa",
  },
];

const RANK_ORDER = RANGOS.map(r => r.rank);

export default function Rangos() {
  const { currentMember } = useAuth();
  const currentRankIdx = RANK_ORDER.indexOf(currentMember?.rank ?? "Bronce");

  return (
    <div className="space-y-6">
      {/* Gemstone sparkle animation styles */}
      <style>{`
        @keyframes gem-shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes gem-ring-pulse {
          0%, 100% { box-shadow: 0 0 15px var(--gem-glow), inset 0 0 10px var(--gem-glow-inner); }
          50% { box-shadow: 0 0 25px var(--gem-glow), 0 0 40px var(--gem-glow-far), inset 0 0 15px var(--gem-glow-inner); }
        }
        @keyframes float-gem {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .gem-sparkle {
          animation: gem-shimmer 3s ease-in-out infinite;
        }
        .gem-ring {
          animation: gem-ring-pulse 4s ease-in-out infinite;
        }
        .gem-float {
          animation: float-gem 6s ease-in-out infinite;
        }
      `}</style>

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
            Sistema de 15 rangos con piedras preciosas. Avanza vendiendo paquetes y gana más por cada referido directo.
          </p>
          {currentMember && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "hsl(42 68% 50% / 0.15)", border: "1px solid hsl(42 68% 50% / 0.3)" }}>
              <span className="text-xs text-muted-foreground">Tu rango actual:</span>
              <span className="text-sm font-black" style={{ color: GOLD }}>{currentMember.rank}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rangos list — premium gemstone cards */}
      <div className="space-y-4">
        {RANGOS.map((rango, i) => {
          const isAchieved = i <= currentRankIdx;
          const isCurrent = i === currentRankIdx;
          const gem = GEM_CONFIG[rango.rank];
          const glowColor = gem?.glowColor || rango.color;

          return (
            <Card key={rango.rank}
              className={`border relative overflow-hidden transition-all duration-500 ${isCurrent ? "scale-[1.01]" : ""}`}
              style={{
                borderColor: isCurrent ? `${glowColor}60` : isAchieved ? `${glowColor}25` : "hsl(0 0% 100% / 0.04)",
                background: isCurrent
                  ? `linear-gradient(135deg, ${glowColor}12, hsl(0 0% 4%) 40%, ${glowColor}08)`
                  : isAchieved
                    ? `linear-gradient(135deg, ${glowColor}08, hsl(0 0% 4%) 50%)`
                    : "hsl(0 0% 100% / 0.01)",
                opacity: !isAchieved && !isCurrent ? 0.55 : 1,
                boxShadow: isCurrent ? `0 0 30px ${glowColor}15, 0 4px 20px rgba(0,0,0,0.3)` : "none",
              }}>
              {/* Background glow for current rank */}
              {isCurrent && (
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" 
                  style={{ background: glowColor, transform: "translate(20%, -30%)" }} />
              )}

              <CardContent className="p-0">
                <div className="flex items-center gap-0">
                  {/* Left side: Info */}
                  <div className="flex-1 min-w-0 p-4 pr-2">
                    {/* Rank number and badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-black text-muted-foreground">#{i + 1}</span>
                      <span className="text-lg font-black leading-tight" style={{ color: isCurrent || isAchieved ? glowColor : "hsl(240,5%,50%)" }}>
                        {rango.rank}
                      </span>
                      {!isAchieved && <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />}
                      {isCurrent && (
                        <Badge className="text-[9px] font-black uppercase px-1.5 py-0 ml-1" style={{ background: glowColor, color: "black" }}>
                          Tu rango
                        </Badge>
                      )}
                    </div>

                    {/* Requirement */}
                    <p className="text-xs text-muted-foreground mb-3">{rango.requirement}</p>

                    {/* Bonus and Prize tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{ background: `${glowColor}18`, color: glowColor, border: `1px solid ${glowColor}25` }}>
                        ${rango.bonus} USD / referido
                      </div>
                      {rango.prize && (
                        <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 text-muted-foreground border border-white/5">
                          🎁 {rango.prize}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Gemstone image */}
                  <div className="shrink-0 pr-4 py-3 flex items-center justify-center">
                    <div className="gem-float" style={{ animationDelay: `${i * 0.4}s` }}>
                      <div
                        className="gem-ring rounded-full p-[3px]"
                        style={{
                          width: 80,
                          height: 80,
                          background: `linear-gradient(135deg, ${glowColor}90, ${glowColor}30, ${glowColor}70)`,
                          "--gem-glow": `${glowColor}40`,
                          "--gem-glow-far": `${glowColor}15`,
                          "--gem-glow-inner": `${glowColor}20`,
                        } as React.CSSProperties}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-black/60 relative"
                          style={{ boxShadow: `inset 0 0 20px ${glowColor}30` }}>
                          {gem?.image ? (
                            <img
                              src={gem.image}
                              alt={rango.rank}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <CSSGemstone
                              color={gem?.color || rango.color}
                              secondaryColor={gem?.secondary || rango.color}
                            />
                          )}
                        </div>
                      </div>
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
