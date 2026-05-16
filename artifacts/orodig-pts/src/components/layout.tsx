import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, History, Trophy, ShoppingBag,
  ArrowDownToLine, User, Menu, X, LogOut, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GOLD = "hsl(42,68%,50%)";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentMember, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !currentMember) setLocation("/");
  }, [currentMember, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          <p className="text-sm font-medium" style={{ color: GOLD }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentMember) return null;
  return <>{children}</>;
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Panel Principal", short: "Panel" },
  { href: "/network",   icon: Users,           label: "Mi Red",          short: "Red" },
  { href: "/earnings",  icon: History,         label: "Ganancias",       short: "Ganancias" },
  { href: "/leaderboard",icon: Trophy,         label: "Clasificación",   short: "Top" },
  { href: "/products",  icon: ShoppingBag,     label: "Productos",       short: "Tienda" },
  { href: "/withdrawals",icon: ArrowDownToLine,label: "Retiros",         short: "Retiros" },
  { href: "/profile",   icon: User,            label: "Mi Perfil",       short: "Perfil" },
];

// Only main 5 in the mobile bottom bar
const BOTTOM_NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Panel" },
  { href: "/network",    icon: Users,           label: "Red" },
  { href: "/earnings",   icon: History,         label: "Ganancias" },
  { href: "/products",   icon: ShoppingBag,     label: "Tienda" },
  { href: "/profile",    icon: User,            label: "Perfil" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentMember, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoutMutation } = useLogoutAction(logout);

  if (!currentMember) return <>{children}</>;

  const SidebarInner = () => (
    <>
      {/* Brand */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-black"
            style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` }}>O</div>
          <div>
            <h1 className="text-base font-black tracking-tighter leading-none" style={{ color: GOLD }}>
              ORODIG <span className="text-white">PTS</span>
            </h1>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">Oro Digital Para Todos</p>
          </div>
        </div>
      </div>

      {/* Balance quick card */}
      <div className="mx-3 mt-3 p-3 rounded-xl border" style={{ background: "linear-gradient(135deg, hsl(42,68%,12%), hsl(42,68%,8%))", borderColor: "hsl(42 68% 50% / 0.2)" }}>
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Saldo disponible</div>
        <div className="text-xl font-black" style={{ color: GOLD }}>${Number(currentMember.balance).toFixed(2)}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-muted-foreground">Cuenta activa</span>
        </div>
      </div>

      {/* User pill */}
      <div className="mx-3 mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0"
          style={{ background: `linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,58%))` }}>
          {currentMember.fullName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">{currentMember.fullName}</p>
          <RankBadge rank={currentMember.rank} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2 mb-2">Menú</div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm group ${
                isActive
                  ? "font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/4"
              }`}
              style={isActive ? {
                background: "hsl(42 68% 50% / 0.12)",
                color: GOLD,
                border: "1px solid hsl(42 68% 50% / 0.2)",
              } : {}}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "" : "group-hover:text-foreground"}`}
                style={isActive ? { color: GOLD } : {}} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3" style={{ color: GOLD }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => logoutMutation()}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground dark">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/5 bg-card">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-md border-b border-white/5">
        <h1 className="text-lg font-black tracking-tighter" style={{ color: GOLD }}>
          ORODIG <span className="text-white">PTS</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground leading-none">Saldo</div>
            <div className="text-sm font-black leading-none" style={{ color: GOLD }}>${Number(currentMember.balance).toFixed(2)}</div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 flex flex-col w-72 bg-card border-r border-white/5 h-full overflow-y-auto">
            <div className="pt-16">
              <SidebarInner />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        <div className="pointer-events-none fixed inset-0 z-[-1]"
          style={{ background: "radial-gradient(circle at top right, hsl(42 68% 50% / 0.03), transparent 40%), radial-gradient(circle at bottom left, hsl(273 100% 50% / 0.03), transparent 40%)" }}
        />
        {/* Top bar spacer on mobile, content padding */}
        <div className="pt-14 md:pt-0 pb-20 md:pb-0 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-white/5 flex">
        {BOTTOM_NAV.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={isActive ? { color: GOLD } : { color: "hsl(240,5%,55%)" }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function useLogoutAction(logout: () => void) {
  const logoutMutation = () => {
    fetch("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("orodig_token")}` } })
      .finally(() => logout());
  };
  return { logoutMutation };
}

export function RankBadge({ rank }: { rank: string }) {
  const styles: Record<string, string> = {
    Bronce:    "bg-amber-700/20 text-amber-600 border-amber-700/40",
    Plata:     "bg-slate-400/20 text-slate-300 border-slate-400/40",
    Oro:       "border",
    Platino:   "bg-cyan-200/20 text-cyan-200 border-cyan-200/40",
    Diamante:  "bg-cyan-400/20 text-cyan-400 border-cyan-400/40",
    Embajador: "bg-purple-600/20 text-purple-400 border-purple-600/40",
  };

  if (rank === "Oro") {
    return (
      <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0"
        style={{ background: "hsl(42 68% 50% / 0.15)", color: GOLD, borderColor: "hsl(42 68% 50% / 0.4)" }}>
        {rank}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 border ${styles[rank] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40"}`}>
      {rank}
    </Badge>
  );
}
