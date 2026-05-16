import { useGetMemberNetwork } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/layout";
import { Users } from "lucide-react";

type NetworkNode = {
  id: number;
  fullName: string;
  username: string;
  rank: string;
  referralCode: string;
  directReferrals: number;
  totalEarnings: number;
  isActive: boolean;
  level: number;
  avatarUrl: string | null;
  children: NetworkNode[];
};

function TreeNode({ node, level = 0 }: { node: NetworkNode; level?: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      <div
        className={`flex items-center p-2.5 sm:p-3 my-1.5 rounded-lg border ${node.isActive ? "border-primary/20 bg-background/50" : "border-border/20 bg-background/20 opacity-60"} hover:border-primary/40 transition-colors`}
        style={{ marginLeft: `${level * 1.5}rem` }}
        data-testid={`node-network-${node.id}`}
      >
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {node.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-sm truncate">{node.fullName}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">@{node.username}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RankBadge rank={node.rank} />
                <span className="text-[10px] text-muted-foreground">Nivel {node.level}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-black text-primary">${node.totalEarnings.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">{node.directReferrals} directos</div>
          </div>
        </div>
      </div>

      {hasChildren && (
        <div className="relative border-l border-border/40 ml-3 sm:ml-4 pl-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Network() {
  const { currentMember } = useAuth();
  const { data: network, isLoading } = useGetMemberNetwork(currentMember!.id);

  if (isLoading) {
    return <div className="text-primary font-bold animate-pulse pt-4">Cargando red de referidos...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI RED DE REFERIDOS</h1>
        <p className="text-muted-foreground text-sm">Tu organización de riqueza pasiva.</p>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="w-4 h-4 text-primary" />
            Estructura de la Red (hasta 3 niveles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              {network ? (
                <TreeNode node={network as NetworkNode} />
              ) : (
                <div className="text-center p-8 text-muted-foreground text-sm">Sin datos de red. ¡Empieza a reclutar!</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
