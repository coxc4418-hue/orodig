import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal } from "lucide-react";
import { RankBadge } from "@/components/layout";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return <div className="text-primary">Loading elite rankings...</div>;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
      case 2: return <Medal className="w-6 h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />;
      case 3: return <Medal className="w-6 h-6 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />;
      default: return <span className="text-lg font-black text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">ELITE LEADERBOARD</h1>
        <p className="text-muted-foreground">The top wealth generators in the network.</p>
      </div>

      <Card className="bg-card border-primary/20 shadow-[0_0_20px_rgba(255,215,0,0.05)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Trophy className="w-5 h-5" />
            Top Earners Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard?.map((entry) => (
              <div 
                key={entry.memberId} 
                className={`flex items-center p-4 rounded-xl border ${entry.rank <= 3 ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background/50'} transition-all hover:border-primary/50`}
              >
                <div className="w-12 flex justify-center mr-2">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold mr-4 shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    entry.fullName.charAt(0)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{entry.fullName}</span>
                    <RankBadge rank={entry.memberRank} />
                  </div>
                  <div className="text-sm text-muted-foreground">@{entry.username} • {entry.directReferrals} directs</div>
                </div>
                
                <div className="text-right shrink-0 ml-4">
                  <div className={`text-lg font-black ${entry.rank <= 3 ? 'text-primary drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]' : 'text-white'}`}>
                    ${entry.totalEarnings.toFixed(2)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Earned</div>
                </div>
              </div>
            ))}
            
            {(!leaderboard || leaderboard.length === 0) && (
              <div className="text-center p-8 text-muted-foreground">No leaderboard data available.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
