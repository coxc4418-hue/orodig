import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/layout";
import { Mail, Phone, Calendar, Copy, LogOut, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@workspace/api-client-react";

export default function Profile() {
  const { currentMember, logout } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  if (!currentMember) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(currentMember.referralCode);
    toast({ title: "Copiado", description: "Código de referido copiado al portapapeles" });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => logout() });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI PERFIL</h1>
        <p className="text-muted-foreground text-sm">Tus credenciales y estadísticas de la red.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card border-border/50 text-center flex flex-col items-center pt-6 pb-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-black mb-3 ring-2 ring-primary/50 ring-offset-4 ring-offset-background">
            {currentMember.avatarUrl ? (
              <img src={currentMember.avatarUrl} alt={currentMember.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              currentMember.fullName.charAt(0)
            )}
          </div>
          <h2 className="text-lg font-bold text-white mb-1">{currentMember.fullName}</h2>
          <p className="text-muted-foreground text-sm mb-3">@{currentMember.username}</p>
          <RankBadge rank={currentMember.rank} />

          <div className="w-full px-4 mt-6 space-y-2">
            <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-left">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Red Total</div>
              <div className="text-lg font-black text-white">{currentMember.totalNetwork} <span className="text-xs font-normal text-muted-foreground">miembros</span></div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-left">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Referidos Directos</div>
              <div className="text-lg font-black text-white">{currentMember.directReferrals}</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-left">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Total Ganado</div>
              <div className="text-lg font-black text-primary">${currentMember.totalEarnings.toFixed(2)}</div>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Mail, label: "Correo", value: currentMember.email },
                { icon: Phone, label: "Teléfono", value: currentMember.phone || "No registrado" },
                { icon: Calendar, label: "Registro", value: format(new Date(currentMember.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es }) },
                ...(currentMember.sponsorName ? [{ icon: User, label: "Patrocinador", value: currentMember.sponsorName }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</div>
                    <div className="text-white font-medium text-sm truncate">{value}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/30 shadow-[0_0_15px_rgba(255,215,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -mr-8 -mt-8" />
            <CardHeader className="pb-2">
              <CardTitle className="text-primary text-sm sm:text-base">Tu Codigo de Referido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Comparte este código para hacer crecer tu red y ganar ingresos pasivos de tu línea descendente.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background border border-primary/30 rounded-md px-4 py-3 font-mono text-lg font-bold text-white tracking-widest text-center">
                  {currentMember.referralCode}
                </div>
                <Button onClick={copyReferral} data-testid="button-copy-referral" className="bg-primary hover:bg-primary/90 text-black h-auto py-3 px-5 shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="destructive"
            className="w-full font-bold uppercase tracking-wider h-11"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
