import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardActivity, getGetDashboardActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Award, Zap, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity();

  if (isSummaryLoading || isActivityLoading) {
    return <div className="text-primary">Loading command center...</div>;
  }

  if (!summary) return null;

  const pieData = [
    { name: "Referral", value: summary.earningsByType.referral, color: "#FFD700" },
    { name: "Sales", value: summary.earningsByType.sales, color: "#8B00FF" },
    { name: "Purchases", value: summary.earningsByType.purchases, color: "#00FF00" },
    { name: "Leadership", value: summary.earningsByType.leadership, color: "#00FFFF" },
    { name: "Work", value: summary.earningsByType.work, color: "#FF00FF" },
    { name: "Passive", value: summary.earningsByType.passive, color: "#FF4500" },
  ].filter(d => d.value > 0);

  const barData = summary.monthlyEarnings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">COMMAND CENTER</h1>
        <p className="text-muted-foreground">Your wealth generation overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/20 shadow-[0_0_15px_rgba(255,215,0,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
              ${summary.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-purple-500/20 shadow-[0_0_15px_rgba(139,0,255,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Reward Points</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-400 drop-shadow-[0_0_8px_rgba(139,0,255,0.5)]">
              {summary.points}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Earnings</CardTitle>
            <Award className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              ${summary.totalEarnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-green-500/20 shadow-[0_0_15px_rgba(0,255,0,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Network Size</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]">
              {summary.totalNetwork}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{summary.directReferrals} direct</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border/50">
          <CardHeader>
            <CardTitle>Earnings Momentum</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-card border-border/50">
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No earnings yet</div>
              )}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-2xl font-black text-white">${summary.totalEarnings.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Live Network Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity && activity.length > 0 ? activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
                {item.amount > 0 && (
                  <div className="font-black text-green-400">+${item.amount.toFixed(2)}</div>
                )}
              </div>
            )) : (
              <div className="text-center p-4 text-muted-foreground">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
