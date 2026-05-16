import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, History, Trophy, ShoppingBag, ArrowDownToLine, User, Menu, X } from "lucide-react";
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-bold animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!currentMember) return null;

  return <>{children}</>;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Panel Principal" },
  { href: "/network", icon: Users, label: "Mi Red" },
  { href: "/earnings", icon: History, label: "Ganancias" },
  { href: "/leaderboard", icon: Trophy, label: "Clasificación" },
  { href: "/products", icon: ShoppingBag, label: "Productos" },
  { href: "/withdrawals", icon: ArrowDownToLine, label: "Retiros" },
  { href: "/profile", icon: User, label: "Mi Perfil" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentMember } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentMember) {
    return <>{children}</>;
  }

  const SidebarContent = () => (
    <>
      <div className="py-5 px-4 border-b border-border/50">
        <h1 className="text-xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
          ORODIG <span className="text-foreground">PTS</span>
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">Oro Digital Para Todos</p>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              data-testid={`nav-${item.href.slice(1)}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-primary/15 text-primary font-bold border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50 bg-card/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {currentMember.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{currentMember.fullName}</p>
            <RankBadge rank={currentMember.rank} />
          </div>
        </div>
        <div className="flex flex-col p-2 bg-background rounded-md border border-border">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponible</span>
          <span className="text-lg font-black text-primary">${currentMember.balance.toFixed(2)}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground dark selection:bg-primary selection:text-primary-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-border/50 bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b border-border/50">
        <h1 className="text-lg font-black tracking-tighter text-primary">
          ORODIG <span className="text-foreground">PTS</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-primary">${currentMember.balance.toFixed(2)}</span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
            className="p-2 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 bg-card border-r border-border/50 h-full">
            <div className="pt-16">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto relative">
        <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_top_right,rgba(255,215,0,0.04),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(139,0,255,0.04),transparent_40%)]" />
        <div className="pt-16 md:pt-0 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export function RankBadge({ rank }: { rank: string }) {
  let colors = "bg-gray-500/20 text-gray-400 border-gray-500/50";
  if (rank === "Bronce") colors = "bg-amber-700/20 text-amber-500 border-amber-700/50";
  if (rank === "Plata") colors = "bg-slate-400/20 text-slate-300 border-slate-400/50";
  if (rank === "Oro") colors = "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]";
  if (rank === "Platino") colors = "bg-cyan-200/20 text-cyan-200 border-cyan-200/50";
  if (rank === "Diamante") colors = "bg-cyan-400/20 text-cyan-400 border-cyan-400/50 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]";
  if (rank === "Embajador") colors = "bg-purple-600/20 text-purple-400 border-purple-600/50 drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]";

  return (
    <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 border ${colors}`}>
      {rank}
    </Badge>
  );
}
