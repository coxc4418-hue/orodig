import { useGetMemberNetwork, getGetMemberNetworkQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/layout";
import { NetworkNode } from "@workspace/api-client-react/src/generated/api.schemas";
import { ChevronRight, Users } from "lucide-react";

function TreeNode({ node, level = 0 }: { node: NetworkNode, level?: number }) {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className="relative">
      <div 
        className={`flex items-center p-3 my-2 rounded-lg border ${node.isActive ? 'border-primary/20 bg-background/50' : 'border-border/20 bg-background/20 opacity-60'} hover:border-primary/50 transition-colors`}
        style={{ marginLeft: `${level * 2}rem` }}
      >
        {level > 0 && (
          <div className="absolute w-6 border-t border-border/50" style={{ left: `${level * 2 - 1.5}rem` }} />
        )}
        
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {node.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{node.fullName}</span>
                <span className="text-xs text-muted-foreground">@{node.username}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge rank={node.rank} />
                <span className="text-xs text-muted-foreground">Level {node.level}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-black text-primary">${node.totalEarnings.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{node.directReferrals} direct</div>
          </div>
        </div>
      </div>
      
      {hasChildren && (
        <div className="relative">
          <div className="absolute top-0 bottom-0 border-l border-border/50" style={{ left: `${level * 2 + 1}rem` }} />
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
  // using currentMember id. If currentMember is not available, we should not be here due to ProtectedRoute
  const { data: network, isLoading } = useGetMemberNetwork(currentMember!.id);

  if (isLoading) {
    return <div className="text-primary">Loading network topography...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">REFERRAL NETWORK</h1>
        <p className="text-muted-foreground">Your empire of passive wealth.</p>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Downline Topography
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[600px] relative">
              {network ? (
                <TreeNode node={network} />
              ) : (
                <div className="text-center p-8 text-muted-foreground">No network data available. Start recruiting!</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
