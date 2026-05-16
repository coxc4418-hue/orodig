import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal } from "lucide-react";
import { RankBadge } from "@/components/layout";

const GOLD = "hsl(42,68%,50%)";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "hsl(42 68% 50% / 0.2)" }}>
          <Crown className="w-4 h-4" style={{ color: GOLD }} />
        </div>
      );
      case 2: return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-400/20">
          <Medal className="w-4 h-4 text-slate-300" />
        </div>
      );
      case 3: return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-700/20">
          <Medal className="w-4 h-4 text-amber-600" />
        </div>
      );
      default: return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
          <span className="text-sm font-black text-muted-foreground">{position}</span>
        </div>
      );
    }
  };

  const podiumColors = [
    "border-[hsl(42_68%_50%_/_0.4)] bg-[hsl(42_68%_50%_/_0.06)]",
    "border-slate-400/30 bg-slate-400/5",
    "border-amber-700/30 bg-amber-700/5",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CLASIFICACIÓN DE LÍDERES</h1>
        <p className="text-muted-foreground text-sm">Los mejores generadores de riqueza de la red.</p>
      </div>

      {/* Top 3 podium on desktop */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="hidden sm:grid grid-cols-3 gap-3">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            const positions = [2, 1, 3];
            const pos = positions[i];
            const heights = ["pt-6", "pt-2", "pt-8"];
            return (
              <Card key={entry.memberId} className={`text-center border ${podiumColors[pos - 1]} ${heights[i]}`}>
                <CardContent className="p-4">
                  <div className="flex justify-center mb-2">
                    {pos === 1
                      ? <Crown className="w-6 h-6" style={{ color: GOLD }} />
                      : <Medal className={`w-6 h-6 ${pos === 2 ? "text-slate-300" : "text-amber-600"}`} />}
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-black mx-auto mb-2"
                    style={{ background: pos === 1 ? `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` : "rgba(255,255,255,0.1)", color: pos === 1 ? "black" : "white" }}>
                    {entry.fullName.charAt(0)}
                  </div>
                  <p className="font-bold text-white text-sm truncate">{entry.fullName}</p>
                  <RankBadge rank={entry.memberRank} />
                  <p className="text-xs text-muted-foreground mt-1">@{entry.username}</p>
                  <p className={`text-lg font-black mt-2 ${pos === 1 ? "" : "text-white"}`} style={pos === 1 ? { color: GOLD } : {}}>
                    ${entry.totalEarnings.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-card border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm" style={{ color: GOLD }}>
            <Trophy className="w-4 h-4" />
            Tabla de Clasificación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {leaderboard?.map((entry) => (
              <div
                key={entry.memberId}
                className={`flex items-center px-4 py-3 gap-3 transition-colors hover:bg-white/3 ${entry.rank <= 3 ? "bg-[hsl(42_68%_50%_/_0.03)]" : ""}`}
              >
                <div className="shrink-0">{getRankIcon(entry.rank)}</div>

                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                  style={entry.rank === 1
                    ? { background: "linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))", color: "black" }
                    : { background: "rgba(255,255,255,0.08)", color: "white" }}>
                  {entry.fullName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">{entry.fullName}</span>
                    <RankBadge rank={entry.memberRank} />
                  </div>
                  <p className="text-xs text-muted-foreground">@{entry.username} · {entry.directReferrals} directos</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black" style={entry.rank <= 3 ? { color: GOLD } : { color: "white" }}>
                    ${entry.totalEarnings.toFixed(2)}
                  </div>
                  <div className="text-[9px] uppercase text-muted-foreground font-bold">Total</div>
                </div>
              </div>
            ))}

            {(!leaderboard || leaderboard.length === 0) && (
              <div className="text-center p-8 text-muted-foreground text-sm">Sin datos de clasificación.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
