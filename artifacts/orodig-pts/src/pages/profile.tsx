import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/layout";
import { User, Mail, Phone, Calendar, Copy, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@workspace/api-client-react";

export default function Profile() {
  const { currentMember, logout } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  if (!currentMember) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(currentMember.referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">OPERATOR IDENTITY</h1>
        <p className="text-muted-foreground">Your network credentials and stats.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card border-border/50 text-center flex flex-col items-center pt-8 pb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-black mb-4 ring-2 ring-primary/50 ring-offset-4 ring-offset-background">
            {currentMember.avatarUrl ? (
              <img src={currentMember.avatarUrl} alt={currentMember.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              currentMember.fullName.charAt(0)
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{currentMember.fullName}</h2>
          <p className="text-muted-foreground mb-4">@{currentMember.username}</p>
          <RankBadge rank={currentMember.rank} />
          
          <div className="w-full px-6 mt-8 space-y-4">
            <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-left">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Network</div>
              <div className="text-xl font-black text-white">{currentMember.totalNetwork} <span className="text-sm font-normal text-muted-foreground">members</span></div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-left">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Direct Referrals</div>
              <div className="text-xl font-black text-white">{currentMember.directReferrals}</div>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email</div>
                  <div className="text-white font-medium">{currentMember.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Phone</div>
                  <div className="text-white font-medium">{currentMember.phone || "Not provided"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Joined</div>
                  <div className="text-white font-medium">{format(new Date(currentMember.createdAt), 'MMMM d, yyyy')}</div>
                </div>
              </div>
              {currentMember.sponsorName && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sponsor</div>
                    <div className="text-primary font-bold">@{currentMember.sponsorName}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/30 shadow-[0_0_15px_rgba(255,215,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <CardHeader>
              <CardTitle className="text-lg text-primary">Referral Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Share this code to build your network and earn passive income from your downline.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background border border-primary/30 rounded-md px-4 py-3 font-mono text-lg font-bold text-white tracking-widest text-center">
                  {currentMember.referralCode}
                </div>
                <Button onClick={copyReferral} className="bg-primary hover:bg-primary/90 text-primary-foreground h-auto py-3 px-6">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="destructive" 
            className="w-full font-bold uppercase tracking-wider h-12"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}
