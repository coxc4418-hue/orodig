import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal } from "lucide-react";
import { RankBadge } from "@/components/layout";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return <div className="text-primary font-bold animate-pulse pt-4">Cargando clasificación...</div>;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
      case 2: return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />;
      case 3: return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />;
      default: return <span className="text-base font-black text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CLASIFICACION DE LIDERES</h1>
        <p className="text-muted-foreground text-sm">Los mejores generadores de riqueza de la red.</p>
      </div>

      <Card className="bg-card border-primary/20 shadow-[0_0_20px_rgba(255,215,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary text-sm sm:text-base">
            <Trophy className="w-4 h-4" />
            Mejores Ganadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard?.map((entry) => (
              <div
                key={entry.memberId}
                data-testid={`row-leaderboard-${entry.memberId}`}
                className={`flex items-center p-3 sm:p-4 rounded-xl border gap-2 sm:gap-3 ${entry.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border/50 bg-background/50"} transition-all hover:border-primary/40`}
              >
                <div className="w-8 sm:w-10 flex justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    entry.fullName.charAt(0)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">{entry.fullName}</span>
                    <RankBadge rank={entry.memberRank} />
                  </div>
                  <div className="text-xs text-muted-foreground">@{entry.username} • {entry.directReferrals} directos</div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-base sm:text-lg font-black ${entry.rank <= 3 ? "text-primary drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" : "text-white"}`}>
                    ${entry.totalEarnings.toFixed(2)}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total Ganado</div>
                </div>
              </div>
            ))}

            {(!leaderboard || leaderboard.length === 0) && (
              <div className="text-center p-8 text-muted-foreground text-sm">Sin datos de clasificación disponibles.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
