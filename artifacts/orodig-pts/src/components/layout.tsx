import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, History, Trophy, ShoppingBag, ArrowDownToLine, User } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentMember, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !currentMember) {
      setLocation("/");
    }
  }, [currentMember, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Loading...</div>;
  }

  if (!currentMember) return null;

  return <>{children}</>;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/network", icon: Users, label: "Network" },
  { href: "/earnings", icon: History, label: "Earnings" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/products", icon: ShoppingBag, label: "Products" },
  { href: "/withdrawals", icon: ArrowDownToLine, label: "Withdrawals" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentMember } = useAuth();
  const [location] = useLocation();

  if (!currentMember) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground dark selection:bg-primary selection:text-primary-foreground">
        <Sidebar variant="inset" className="border-r border-border/50 bg-card">
          <SidebarHeader className="py-6 px-4">
            <h1 className="text-2xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              ORODIG <span className="text-foreground">PTS</span>
            </h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-md">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {currentMember.fullName.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold truncate max-w-[120px]">{currentMember.fullName}</span>
                  <RankBadge rank={currentMember.rank} />
                </div>
              </div>
              <div className="mt-2 flex flex-col p-2 bg-background rounded-md border border-border">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Balance</span>
                <span className="text-lg font-black text-accent">${currentMember.balance.toFixed(2)}</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto relative">
          {/* Subtle noise/glow background effect */}
          <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_top_right,rgba(255,215,0,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(139,0,255,0.05),transparent_40%)]" />
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export function RankBadge({ rank }: { rank: string }) {
  let colors = "bg-gray-500/20 text-gray-400 border-gray-500/50";
  
  if (rank === "Bronce") colors = "bg-amber-700/20 text-amber-500 border-amber-700/50";
  if (rank === "Plata") colors = "bg-slate-400/20 text-slate-300 border-slate-400/50";
  if (rank === "Oro") colors = "bg-yellow-500/20 text-yellow-500 border-yellow-500/50 drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]";
  if (rank === "Platino") colors = "bg-cyan-200/20 text-cyan-200 border-cyan-200/50";
  if (rank === "Diamante") colors = "bg-cyan-400/20 text-cyan-400 border-cyan-400/50 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]";
  if (rank === "Embajador") colors = "bg-purple-600/20 text-purple-400 border-purple-600/50 drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]";

  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 border ${colors}`}>
      {rank}
    </Badge>
  );
}
