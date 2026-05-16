import { useGetMemberNetwork } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/layout";
import { Users, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const GOLD = "hsl(42,68%,50%)";

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

function TreeNode({ node, level = 0, isRoot = false }: { node: NetworkNode; level?: number; isRoot?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={level > 0 ? "ml-4 sm:ml-6 border-l border-white/8 pl-3 sm:pl-4" : ""}>
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border my-1.5 transition-all ${
          isRoot
            ? "border-[hsl(42_68%_50%_/_0.3)] bg-[hsl(42_68%_50%_/_0.05)]"
            : node.isActive
            ? "border-white/8 bg-white/2 hover:border-white/15"
            : "border-white/4 bg-white/1 opacity-50"
        }`}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-black"
          style={isRoot
            ? { background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }
            : { background: "rgba(255,255,255,0.08)", color: "white" }}
        >
          {node.fullName.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm ${isRoot ? "" : "text-white"}`} style={isRoot ? { color: GOLD } : {}}>
              {node.fullName}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">@{node.username}</span>
            <RankBadge rank={node.rank} />
            {!node.isActive && <span className="text-[9px] text-muted-foreground uppercase font-bold">Inactivo</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>Nivel {node.level}</span>
            <span>{node.directReferrals} directos</span>
            <span className="font-bold" style={{ color: GOLD }}>${node.totalEarnings.toFixed(2)}</span>
          </div>
        </div>

        {/* Expand toggle */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
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
    return (
      <div className="space-y-3 pt-2">
        {[1,2,3].map(i => <div key={i} className={`h-14 rounded-xl bg-white/5 animate-pulse`} style={{ marginLeft: `${(i-1)*1.5}rem` }} />)}
      </div>
    );
  }

  const totalInNetwork = network
    ? countNodes(network as NetworkNode) - 1
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI RED DE REFERIDOS</h1>
        <p className="text-muted-foreground text-sm">Visualiza tu organización de ingresos pasivos.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Miembros en la red", value: currentMember!.totalNetwork },
          { label: "Referidos directos",  value: currentMember!.directReferrals },
          { label: "Niveles visibles",    value: "3" },
        ].map(({ label, value }) => (
          <Card key={label} className="bg-card border-white/5 text-center">
            <CardContent className="p-3">
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" style={{ color: GOLD }} />
              Árbol de Red (hasta 3 niveles)
            </CardTitle>
            <span className="text-xs text-muted-foreground">{totalInNetwork} miembro{totalInNetwork !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent>
          {network ? (
            <TreeNode node={network as NetworkNode} isRoot={true} />
          ) : (
            <div className="flex flex-col items-center justify-center p-10 gap-3 text-muted-foreground">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm text-center">Tu red está vacía. Comparte tu código de referido para comenzar a construir tu organización.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function countNodes(node: NetworkNode): number {
  return 1 + (node.children?.reduce((s, c) => s + countNodes(c), 0) ?? 0);
}
