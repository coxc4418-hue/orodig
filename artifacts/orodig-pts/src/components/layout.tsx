import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, History, Trophy, ShoppingBag,
  ArrowDownToLine, User, Menu, X, LogOut, ChevronRight, Shield,
  Gift, Layers, Diamond, Wallet, Globe
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-[hsl(42,68%,50%)] animate-spin" />
      </div>
    );
  }

  if (!currentMember) return null;
  return <>{children}</>;
}

const NAV_ITEMS = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Panel Principal", short: "Panel", neon: "#22d3ee" },
  { href: "/community",  icon: Globe,           label: "Comunidad Social", short: "Comunidad", neon: "#a78bfa" },
  { href: "/network",    icon: Users,           label: "Mi Red",          short: "Red", neon: "#34d399" },
  { href: "/earnings",   icon: History,         label: "Ganancias",       short: "Ganancias", neon: "#fbbf24" },
  { href: "/leaderboard",icon: Trophy,          label: "Clasificación",   short: "Top", neon: "#f472b6" },
  { href: "/products",   icon: ShoppingBag,     label: "Productos",       short: "Tienda", neon: "#fb923c" },
  { href: "/withdrawals",icon: Wallet,          label: "Fondos",          short: "Fondos", neon: "#4ade80" },
  { href: "/rangos",     icon: Diamond,         label: "Rangos Mineros",  short: "Rangos", neon: "#e879f9" },
  { href: "/premios",    icon: Gift,            label: "Premios & Metas", short: "Premios", neon: "#facc15" },
  { href: "/plan",       icon: Layers,          label: "Plan de Compensación", short: "Plan", neon: "#60a5fa" },
  { href: "/profile",    icon: User,            label: "Mi Perfil",       short: "Perfil", neon: "#f87171" },
];

function neonLabelStyle(color: string, active: boolean) {
  return {
    color: active ? color : `${color}cc`,
    textShadow: active
      ? `0 0 6px ${color}, 0 0 14px ${color}99, 0 0 28px ${color}44`
      : `0 0 4px ${color}88`,
  } as const;
}

const BOTTOM_NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Panel" },
  { href: "/community",  icon: Globe,           label: "Comunidad" },
  { href: "/products",   icon: ShoppingBag,     label: "Tienda" },
  { href: "/premios",    icon: Gift,            label: "Premios" },
  { href: "/profile",    icon: User,            label: "Perfil" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentMember, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoutMutation } = useLogoutAction(logout);

  if (!currentMember) return <>{children}</>;

  const isAdmin = currentMember.username === "admin";
  const navItems = isAdmin
    ? [
        { href: "/admin", icon: Shield, label: "Panel Admin", short: "Admin", neon: "#c084fc" },
        { href: "/community", icon: Globe, label: "Comunidad Social", short: "Comunidad", neon: "#a78bfa" },
        { href: "/profile", icon: User, label: "Mi Perfil", short: "Perfil", neon: "#f87171" },
      ]
    : NAV_ITEMS;
  const bottomNavItems = isAdmin
    ? [
        { href: "/admin", icon: Shield, label: "Admin" },
        { href: "/community", icon: Globe, label: "Comunidad" }
      ]
    : BOTTOM_NAV;

  // Membership status from lastPaymentAt
  const membershipStatus = getMembershipStatusClient(currentMember.lastPaymentAt ?? null);

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
      {!isAdmin && (
        <div className="mx-3 mt-3 p-3 rounded-xl border" style={{ background: "linear-gradient(135deg, hsl(42,68%,12%), hsl(42,68%,8%))", borderColor: "hsl(42 68% 50% / 0.2)" }}>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Saldo disponible</div>
          <div className="text-xl font-black" style={{ color: GOLD }}>${Number(currentMember.balance).toFixed(2)}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: membershipStatus.dotColor }} />
            <span className="text-[10px] text-muted-foreground">{membershipStatus.label}</span>
          </div>
        </div>
      )}

      {/* User pill */}
      <div className="mx-3 mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/3">
        {currentMember.avatarUrl ? (
          <img src={currentMember.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0"
            style={{ background: `linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,58%))` }}>
            {currentMember.fullName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">{currentMember.fullName}</p>
          {!isAdmin ? (
            <RankBadge rank={currentMember.rank} />
          ) : (
            <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 border border-purple-500/30 bg-purple-500/10 text-purple-300">
              Administrador
            </Badge>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-none">
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2 mb-2">Menú</div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          const neon = "neon" in item ? item.neon : GOLD;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm group font-black tracking-wide ${
                isActive ? "" : "hover:bg-white/4"
              }`}
              style={isActive
                ? {
                    background: `${neon}18`,
                    border: `1px solid ${neon}44`,
                    ...neonLabelStyle(neon, true),
                  }
                : neonLabelStyle(neon, false)
              }
            >
              <item.icon
                className="w-4 h-4 shrink-0"
                style={{ color: neon, filter: `drop-shadow(0 0 4px ${neon})` }}
              />
              <span className="flex-1 uppercase text-[11px]">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3" style={{ color: neon }} />}
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
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/5 bg-card overflow-hidden">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-md border-b border-white/5">
        <h1 className="text-lg font-black tracking-tighter" style={{ color: GOLD }}>
          ORODIG <span className="text-white">PTS</span>
        </h1>
        <div className="flex items-center gap-3">
          {!isAdmin ? (
            <div className="text-right">
              <div className="text-xs text-muted-foreground leading-none">Saldo</div>
              <div className="text-sm font-black leading-none" style={{ color: GOLD }}>${Number(currentMember.balance).toFixed(2)}</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-purple-300 tracking-wider">Modo Admin</div>
            </div>
          )}
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
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative">
        <div className="pointer-events-none fixed inset-0 z-[-1]"
          style={{ background: "radial-gradient(circle at top right, hsl(42 68% 50% / 0.03), transparent 40%), radial-gradient(circle at bottom left, hsl(273 100% 50% / 0.03), transparent 40%)" }}
        />
        <div className="pt-14 md:pt-0 pb-20 md:pb-0 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-white/5 flex">
        {bottomNavItems.map((item) => {
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

// Client-side membership status calculation
function getMembershipStatusClient(lastPaymentAt: string | null): { label: string; dotColor: string } {
  if (!lastPaymentAt) return { label: "Sin registro", dotColor: "#6b7280" };
  const now = new Date();
  const paymentDate = new Date(lastPaymentAt);
  const daysSince = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 30) return { label: "Activo (Verde)", dotColor: "#22c55e" };
  if (daysSince <= 60) return { label: "Activo Pendiente (Amarillo)", dotColor: "#eab308" };
  if (daysSince < 180) return { label: "Inactivo (Rojo)", dotColor: "#ef4444" };
  return { label: "Eliminado (Gris)", dotColor: "#6b7280" };
}

const RANK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Bronce":              { bg: "#cd7f3215", text: "#cd7f32", border: "#cd7f3240" },
  "Cobre":               { bg: "#b8733315", text: "#b87333", border: "#b8733340" },
  "Crisolito":           { bg: "#a8c09015", text: "#8bab72", border: "#a8c09040" },
  "Belirio Rojo":        { bg: "#dc262615", text: "#f87171", border: "#dc262640" },
  "Tanzanita Verde":     { bg: "#14b8a615", text: "#2dd4bf", border: "#14b8a640" },
  "Plata":               { bg: "#94a3b815", text: "#cbd5e1", border: "#94a3b840" },
  "Oro":                 { bg: "hsl(42 68% 50% / 0.12)", text: "hsl(42,68%,55%)", border: "hsl(42 68% 50% / 0.35)" },
  "Esmeralda Azul":      { bg: "#60a5fa15", text: "#93c5fd", border: "#60a5fa40" },
  "Esmeralda Verde":     { bg: "#34d39915", text: "#6ee7b7", border: "#34d39940" },
  "Diamante Azul":       { bg: "#38bdf815", text: "#7dd3fc", border: "#38bdf840" },
  "Danzanita Verde":     { bg: "#4ade8015", text: "#86efac", border: "#4ade8040" },
  "Diamante Fantasía":   { bg: "#a78bfa15", text: "#c4b5fd", border: "#a78bfa40" },
  "Zafiro Amarillo":     { bg: "#fbbf2415", text: "#fcd34d", border: "#fbbf2440" },
  "Alejandrita Especial":{ bg: "#c084fc15", text: "#d8b4fe", border: "#c084fc40" },
  "Accionista ORODIG":   { bg: "hsl(42 68% 50% / 0.18)", text: "hsl(42,68%,62%)", border: "hsl(42 68% 50% / 0.5)" },
};

export function RankBadge({ rank }: { rank: string }) {
  const style = RANK_STYLES[rank] ?? { bg: "#6b728015", text: "#9ca3af", border: "#6b728040" };
  return (
    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 border truncate max-w-[120px]"
      style={{ background: style.bg, color: style.text, borderColor: style.border }}>
      {rank}
    </Badge>
  );
}
