import { useGetMemberNetwork, useListMembers } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankBadge } from "@/components/layout";
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  TrendingUp, 
  UserCheck, 
  UserMinus, 
  DollarSign, 
  Award, 
  Network as NetworkIcon,
  Info,
  Calendar,
  Phone,
  Mail,
  User,
  Shield,
  MapPin,
  Clock
} from "lucide-react";
import { useState, useMemo } from "react";

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

type Tab = "Árbol Genealógico" | "Miembros por Nivel" | "Simulador y Reglas";
const TABS: Tab[] = ["Árbol Genealógico", "Miembros por Nivel", "Simulador y Reglas"];

// Helper component for rendering recursive nodes in the genealogy tree
function TreeNodeCard({ 
  node, 
  selectedNodeId, 
  onSelect, 
  onFocus 
}: { 
  node: NetworkNode; 
  selectedNodeId: number; 
  onSelect: (id: number) => void; 
  onFocus: (node: { id: number; fullName: string }) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isCardSelected = node.id === selectedNodeId;
  const statusColor = node.isActive ? "bg-emerald-500" : "bg-red-500";
  const statusGlow = node.isActive ? "shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "shadow-[0_0_8px_rgba(239,68,68,0.6)]";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Node Card Button */}
      <button
        onClick={() => onSelect(node.id)}
        className={`w-36 p-2 rounded-xl border text-center transition-all flex flex-col items-center relative gap-1.5 ${
          isCardSelected 
            ? "border-[hsl(42,68%,50%)] bg-[hsl(42,68%,50%)/0.15] shadow-[0_0_15px_rgba(212,175,55,0.25)] scale-105" 
            : "border-white/5 bg-card hover:border-white/10 hover:scale-102"
        }`}
      >
        {/* Status dot */}
        <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${statusColor} ${statusGlow}`} />

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-white/10 mt-1">
          {node.avatarUrl ? (
            <img src={node.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-black text-black"
              style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
              {node.fullName.charAt(0)}
            </div>
          )}
        </div>

        {/* Name / User */}
        <div className="w-full min-w-0">
          <div className="text-[11px] font-bold text-white truncate">{node.fullName}</div>
          <div className="text-[8px] text-muted-foreground truncate">@{node.username}</div>
        </div>

        {/* Rank */}
        <div className="scale-75 origin-center my-0.5">
          <RankBadge rank={node.rank} />
        </div>

        {/* Children indicator indicator */}
        {hasChildren && (
          <div className="text-[8px] px-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold rounded-full">
            +{node.children.length} red
          </div>
        )}
      </button>

      {/* Recursive Render of Children */}
      {hasChildren && (
        <div className="flex flex-col items-center w-full">
          {/* Drop line from parent card */}
          <div className="w-0.5 h-5 bg-amber-500/20" />
          
          {/* Row of children */}
          <div className="flex justify-center items-start w-full">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center px-1">
                  {/* Horizontal connection bar */}
                  {!isOnly && (
                    <div 
                      className="absolute top-0 h-0.5 bg-amber-500/20"
                      style={{
                        left: isFirst ? '50%' : '0',
                        right: isLast ? '50%' : '0',
                      }}
                    />
                  )}
                  {/* Drop line to child card */}
                  <div className="w-0.5 h-5 bg-amber-500/20" />
                  
                  {/* Recursive Card */}
                  <TreeNodeCard 
                    node={child} 
                    selectedNodeId={selectedNodeId} 
                    onSelect={onSelect} 
                    onFocus={onFocus} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Network() {
  const { currentMember } = useAuth();
  const [focusedId, setFocusedId] = useState<number>(currentMember!.id);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(currentMember!.id);
  const [navStack, setNavStack] = useState<{ id: number; fullName: string }[]>([]);
  
  const [activeTab, setActiveTab] = useState<Tab>("Árbol Genealógico");
  const [zoom, setZoom] = useState(0.85);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Levels tab state
  const [levelTab, setLevelTab] = useState<number>(1);
  const [levelSearch, setLevelSearch] = useState("");
  const [levelSort, setLevelSort] = useState<string>("name");

  // Simulator state
  const [simDirects, setSimDirects] = useState<number>(3);
  const [simLevels, setSimLevels] = useState<number>(5);

  const { data: network, isLoading: isNetworkLoading } = useGetMemberNetwork(focusedId);
  const { data: allMembers, isLoading: isMembersLoading } = useListMembers();

  // Helper to determine if a member is in the upline path of another member
  const isDownline = (memberId: number, rootId: number, membersList: any[]): boolean => {
    let current = membersList.find(m => m.id === memberId);
    while (current && current.sponsorId) {
      if (current.sponsorId === rootId) return true;
      current = membersList.find(m => m.id === current.sponsorId);
    }
    return false;
  };

  // Build breadcrumbs path for search matches
  const handleSelectSearchResult = (result: any) => {
    if (!allMembers) return;
    const path: { id: number; fullName: string }[] = [];
    let current = allMembers.find(m => m.id === result.sponsorId);
    
    while (current && current.id !== currentMember!.id) {
      path.unshift({ id: current.id, fullName: current.fullName });
      const currentSponsorId = current.sponsorId;
      current = currentSponsorId ? allMembers.find(m => m.id === currentSponsorId) : undefined;
    }
    
    setNavStack(path);
    setFocusedId(result.id);
    setSelectedNodeId(result.id);
    setSearchQuery("");
  };

  // Navigate focus down
  const handleFocusNode = (node: { id: number; fullName: string }) => {
    // Only push to nav stack if not already focused root
    if (node.id !== focusedId) {
      const parentNode = allMembers?.find(m => m.id === focusedId);
      if (parentNode) {
        setNavStack(prev => [...prev, { id: parentNode.id, fullName: parentNode.fullName }]);
      }
      setFocusedId(node.id);
      setSelectedNodeId(node.id);
    }
  };

  // Navigate stack back up
  const handleGoBack = () => {
    setNavStack(prev => {
      const next = [...prev];
      const parent = next.pop();
      setFocusedId(parent ? parent.id : currentMember!.id);
      setSelectedNodeId(parent ? parent.id : currentMember!.id);
      return next;
    });
  };

  // Reset navigation to self
  const handleReset = () => {
    setNavStack([]);
    setFocusedId(currentMember!.id);
    setSelectedNodeId(currentMember!.id);
  };

  // Filter members for search bar
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !allMembers) return [];
    const q = searchQuery.toLowerCase();
    return allMembers.filter(m => {
      const matchesName = m.fullName.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
      if (!matchesName) return false;
      return m.id === currentMember!.id || isDownline(m.id, currentMember!.id, allMembers);
    }).slice(0, 5);
  }, [searchQuery, allMembers, currentMember]);

  // Find detailed statistics of currently selected node
  const selectedMember = useMemo(() => {
    if (!allMembers) return null;
    return allMembers.find(m => m.id === selectedNodeId) || null;
  }, [selectedNodeId, allMembers]);

  // Flatten active tree by levels
  const membersByLevel = useMemo(() => {
    if (!network) return {};
    const result: Record<number, NetworkNode[]> = {};
    
    function traverse(n: NetworkNode, depth: number) {
      if (depth > 0) {
        if (!result[depth]) result[depth] = [];
        result[depth].push(n);
      }
      if (n.children) {
        for (const child of n.children) {
          traverse(child, depth + 1);
        }
      }
    }
    
    traverse(network as NetworkNode, 0);
    return result;
  }, [network]);

  // Filter and sort members in active level table
  const listForLevel = membersByLevel[levelTab] || [];
  const filteredLevelList = useMemo(() => {
    let list = [...listForLevel];
    if (levelSearch.trim()) {
      const q = levelSearch.toLowerCase();
      list = list.filter(m => m.fullName.toLowerCase().includes(q) || m.username.toLowerCase().includes(q));
    }
    
    list.sort((a, b) => {
      if (levelSort === "name") return a.fullName.localeCompare(b.fullName);
      if (levelSort === "earnings") return b.totalEarnings - a.totalEarnings;
      if (levelSort === "status") return (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
      return 0;
    });
    return list;
  }, [listForLevel, levelSearch, levelSort]);

  // Level statistics summaries
  const levelStats = useMemo(() => {
    const stats: Record<number, { total: number; active: number; inactive: number }> = {};
    for (let l = 1; l <= 3; l++) {
      const members = membersByLevel[l] || [];
      stats[l] = {
        total: members.length,
        active: members.filter(m => m.isActive).length,
        inactive: members.filter(m => !m.isActive).length,
      };
    }
    return stats;
  }, [membersByLevel]);

  // Duplication compensation simulator results
  const simResults = useMemo(() => {
    const results: { level: number; count: number; total: number; commission: number }[] = [];
    let currentCount = 1;
    let totalCount = 0;
    
    // Residual calculation: average residual commission is $1 per member active
    const commPerMember = 1.00;

    for (let l = 1; l <= simLevels; l++) {
      currentCount = currentCount * simDirects;
      totalCount += currentCount;
      results.push({
        level: l,
        count: currentCount,
        total: totalCount,
        commission: totalCount * commPerMember,
      });
    }
    return results;
  }, [simDirects, simLevels]);

  if (isNetworkLoading || isMembersLoading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
        <div className="h-[400px] rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MI RED DE REFERIDOS</h1>
          <p className="text-muted-foreground text-sm">Visualiza y analiza tu organización de ingresos residuales.</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Red Total", value: currentMember!.totalNetwork, color: "text-amber-400" },
          { icon: UserCheck, label: "Referidos directos", value: currentMember!.directReferrals, color: "text-emerald-400" },
          { icon: TrendingUp, label: "Niveles Visibles", value: "3 Niveles", color: "text-purple-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="bg-card border-white/5">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/3">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-base font-black text-white leading-none">{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab ? "text-black" : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab ? { background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Árbol Genealógico */}
      {activeTab === "Árbol Genealógico" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Main tree view container */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-card border border-white/5 p-3 rounded-xl">
              
              {/* Navigation crumbs */}
              <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGoBack}
                  disabled={navStack.length === 0}
                  className="h-8 px-2 text-muted-foreground hover:text-white shrink-0 border-white/5"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Atrás
                </Button>
                <div className="flex items-center gap-1.5 font-medium shrink-0 ml-1">
                  <button onClick={handleReset} className="text-muted-foreground hover:text-white transition-colors">Inicio</button>
                  {navStack.map((item, index) => (
                    <span key={item.id} className="flex items-center gap-1.5 text-muted-foreground">
                      <ChevronRight className="w-3 h-3" />
                      <button
                        onClick={() => {
                          const idx = navStack.findIndex(x => x.id === item.id);
                          const nextStack = navStack.slice(0, idx + 1);
                          setNavStack(nextStack);
                          setFocusedId(item.id);
                          setSelectedNodeId(item.id);
                        }}
                        className="hover:text-white transition-colors"
                      >
                        {item.fullName}
                      </button>
                    </span>
                  ))}
                  {focusedId !== currentMember!.id && (
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span>{network?.fullName}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Downline Search Input */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar en mi red..."
                  className="pl-9 h-9.5 text-xs bg-black/30 border-white/5 focus:border-[hsl(42,68%,50%)]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Search Results Popover */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 z-20 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden divide-y divide-white/5">
                    {searchResults.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectSearchResult(m)}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{m.fullName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">@{m.username}</div>
                        </div>
                        <div className="scale-75 origin-right">
                          <RankBadge rank={m.rank} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Tree Graph Box */}
            <div className="relative">
              {/* Zoom indicators */}
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => setZoom(z => Math.min(z + 0.1, 1.25))} title="Acercar">
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => setZoom(z => Math.max(z - 0.1, 0.45))} title="Alejar">
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => setZoom(0.85)} title="Restablecer">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Pan view viewport */}
              <div className="overflow-auto border border-white/5 rounded-2xl bg-black/20 p-8 min-h-[460px] flex justify-center items-start cursor-grab active:cursor-grabbing">
                <div 
                  className="origin-top transition-transform duration-150"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {network ? (
                    <TreeNodeCard 
                      node={network as NetworkNode} 
                      selectedNodeId={selectedNodeId} 
                      onSelect={(id) => setSelectedNodeId(id)} 
                      onFocus={handleFocusNode} 
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm text-center pt-20">No se pudo cargar la estructura de red.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Selected member side panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-white/5 h-full flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-white/5">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: GOLD }} />
                    Ficha de Miembro
                  </CardTitle>
                  <CardDescription className="text-[11px]">Estadísticas detalladas en la red.</CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {selectedMember ? (
                    <>
                      {/* Avatar name header */}
                      <div className="flex flex-col items-center text-center space-y-2 pb-3 border-b border-white/5">
                        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 border-white/10 shadow-lg">
                          {selectedMember.avatarUrl ? (
                            <img src={selectedMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-black text-black"
                              style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
                              {selectedMember.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{selectedMember.fullName}</h3>
                          <p className="text-xs text-muted-foreground">@{selectedMember.username}</p>
                        </div>
                        <RankBadge rank={selectedMember.rank} />
                      </div>

                      {/* Details specs */}
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center py-1.5 border-b border-white/3">
                          <span className="text-muted-foreground">Estado</span>
                          <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0 ${
                            selectedMember.isActive 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                          }`}>
                            {selectedMember.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-white/3">
                          <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Directos</span>
                          <span className="font-bold text-white">{selectedMember.directReferrals}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-white/3">
                          <span className="text-muted-foreground flex items-center gap-1"><NetworkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Red Total</span>
                          <span className="font-bold text-white">{selectedMember.totalNetwork}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-white/3">
                          <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Ganancias</span>
                          <span className="font-bold text-emerald-400">${selectedMember.totalEarnings.toFixed(2)}</span>
                        </div>

                        {selectedMember.email && (
                          <div className="flex justify-between items-center py-1.5 border-b border-white/3 min-w-0">
                            <span className="text-muted-foreground flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Correo</span>
                            <span className="text-white truncate font-medium max-w-[140px]" title={selectedMember.email}>{selectedMember.email}</span>
                          </div>
                        )}

                        {selectedMember.phone && (
                          <div className="flex justify-between items-center py-1.5 border-b border-white/3">
                            <span className="text-muted-foreground flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Teléfono</span>
                            <span className="text-white font-medium">{selectedMember.phone}</span>
                          </div>
                        )}
                        
                        {selectedMember.createdAt && (
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Registro</span>
                            <span className="text-white font-medium">{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <User className="w-8 h-8 opacity-30 mb-2" />
                      <p className="text-xs">Ningún nodo seleccionado.</p>
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Card Footer controls */}
              {selectedMember && (
                <div className="p-4 border-t border-white/5 space-y-2">
                  {selectedMember.id !== focusedId && (
                    <Button 
                      className="w-full text-black font-black uppercase text-[10px] tracking-widest h-10 shrink-0"
                      style={{ background: `linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,56%))` }}
                      onClick={() => {
                        const targetNode = allMembers?.find(m => m.id === selectedNodeId);
                        if (targetNode) {
                          handleFocusNode(targetNode);
                        }
                      }}
                    >
                      Enfocar esta Red
                    </Button>
                  )}
                  {focusedId !== currentMember!.id && selectedMember.id === focusedId && (
                    <Button 
                      variant="outline" 
                      className="w-full text-white font-black uppercase text-[10px] tracking-widest h-10 border-white/10"
                      onClick={handleReset}
                    >
                      Volver a Mi Red
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>

        </div>
      )}

      {/* Tab: Miembros por Nivel */}
      {activeTab === "Miembros por Nivel" && (
        <div className="space-y-4">
          
          {/* Level selection row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((lvl) => {
              const isActive = levelTab === lvl;
              const stats = levelStats[lvl] || { total: 0, active: 0, inactive: 0 };
              
              return (
                <button
                  key={lvl}
                  onClick={() => setLevelTab(lvl)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isActive 
                      ? "border-[hsl(42,68%,50%)] bg-[hsl(42,68%,50%)/0.06] shadow-lg" 
                      : "border-white/5 bg-card hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Nivel {lvl}</span>
                    <Badge variant="outline" className="text-[10px] font-bold" style={isActive ? { color: GOLD, borderColor: GOLD } : {}}>
                      {stats.total} miembros
                    </Badge>
                  </div>
                  
                  {/* Detailed level breakdown */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground border-t border-white/5 pt-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Activos</div>
                      <div className="font-bold text-white text-sm mt-0.5">{stats.active}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-red-400">Inactivos</div>
                      <div className="font-bold text-white text-sm mt-0.5">{stats.inactive}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Level List Table Card */}
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">Listado de Miembros — Nivel {levelTab}</CardTitle>
                  <CardDescription className="text-xs">Administra los miembros posicionados en el nivel {levelTab} de tu red.</CardDescription>
                </div>

                {/* Table search & filter inputs */}
                <div className="flex gap-2 items-center">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar nivel..."
                      className="pl-8.5 h-8.5 text-xs bg-black/20 border-white/5 focus:border-[hsl(42,68%,50%)]"
                      value={levelSearch}
                      onChange={(e) => setLevelSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="h-8.5 text-xs bg-black/20 border border-white/5 rounded-md px-2 text-white focus:outline-none focus:border-[hsl(42,68%,50%)]"
                    value={levelSort}
                    onChange={(e) => setLevelSort(e.target.value)}
                  >
                    <option value="name">Ordenar: Nombre</option>
                    <option value="earnings">Ordenar: Ganancia</option>
                    <option value="status">Ordenar: Estado</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredLevelList.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/1 border-b border-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-xs text-muted-foreground font-bold">Miembro</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-bold">Rango</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-bold">Estado</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-bold text-right">Ganancias</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-bold text-right">Equipo</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-bold text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLevelList.map((m) => {
                        const fullMemberInfo = allMembers?.find(x => x.id === m.id);
                        return (
                          <TableRow key={m.id} className="border-white/5 hover:bg-white/2 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                                  {m.avatarUrl ? (
                                    <img src={m.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-black"
                                      style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
                                      {m.fullName.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">{m.fullName}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">@{m.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <RankBadge rank={m.rank} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                                m.isActive 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : "bg-red-500/10 border-red-500/20 text-red-400"
                              }`}>
                                {m.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-400 text-xs">
                              ${m.totalEarnings.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div className="font-bold text-white">{fullMemberInfo?.totalNetwork ?? 0}</div>
                              <div className="text-[9px] text-muted-foreground">{m.directReferrals} dir.</div>
                            </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 px-2.5"
                              onClick={() => {
                                setActiveTab("Árbol Genealógico");
                                setSelectedNodeId(m.id);
                                handleFocusNode(m);
                              }}
                            >
                              Ver en Árbol
                            </Button>
                          </TableCell>
                        </TableRow>
                      ); })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
                  <Users className="w-8 h-8 opacity-30" />
                  <p className="text-xs">No se encontraron referidos en este nivel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Simulador y Reglas */}
      {activeTab === "Simulador y Reglas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Simulator Calculator Card */}
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
                Simulador de Duplicación
              </CardTitle>
              <CardDescription className="text-xs">Calcula tu red potencial y comisiones residuales estimadas por nivel.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              
              {/* Sliders selectors */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold">Referidos promedio por miembro (Duplicación)</span>
                    <span className="text-white font-black text-sm bg-white/5 px-2 py-0.5 rounded" style={{ color: GOLD }}>{simDirects}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    className="w-full accent-amber-500 bg-white/5 rounded-lg appearance-none h-1.5"
                    value={simDirects}
                    onChange={(e) => setSimDirects(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold">Niveles de Profundidad</span>
                    <span className="text-white font-black text-sm bg-white/5 px-2 py-0.5 rounded" style={{ color: GOLD }}>{simLevels}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    className="w-full accent-amber-500 bg-white/5 rounded-lg appearance-none h-1.5"
                    value={simLevels}
                    onChange={(e) => setSimLevels(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Simulation Result Details */}
              <div className="space-y-2.5">
                <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Desglose de Crecimiento</h4>
                {simResults.map((res) => (
                  <div key={res.level} className="flex justify-between items-center py-2 border-b border-white/3 text-xs">
                    <span className="text-muted-foreground">Nivel {res.level}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-white font-semibold">{res.count.toLocaleString()} miembros nuevos</span>
                      <span className="font-bold text-white min-w-[70px] text-right">Total: {res.total.toLocaleString()}</span>
                      <span className="font-bold text-emerald-400 min-w-[80px] text-right">${res.commission.toLocaleString()} USD</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Card projection */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Ingreso Residual Proyectado</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">${(simResults[simResults.length - 1]?.commission ?? 0).toLocaleString()} USD <span className="text-xs text-muted-foreground font-bold">/ mes</span></div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              <div className="p-3 bg-white/2 rounded-lg border border-white/5 flex gap-2 items-start text-[11px] text-muted-foreground">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>La simulación asume una comisión residual promedio de $1 USD mensual por cada miembro activo en la organización. Los resultados son proyecciones ilustrativas y dependen del comportamiento real de tu red.</p>
              </div>
            </CardContent>
          </Card>

          {/* Compensation Plan Rules Card */}
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: GOLD }} />
                Plan de Compensación
              </CardTitle>
              <CardDescription className="text-xs">Características de la red lineal de OroDig.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {[
                {
                  icon: Users,
                  color: "text-amber-400",
                  title: "Trabajo Forma Lineal",
                  desc: "Vincular personas de forma infinita hacia la derecha o izquierda bajo tu código directo de patrocinio."
                },
                {
                  icon: Network,
                  color: "text-emerald-400",
                  title: "Residual hasta Nivel 50",
                  desc: "Gana de todas las recompras y suscripciones mensuales de las personas que estén activas en tu descendencia hasta el nivel 50."
                },
                {
                  icon: Award,
                  color: "text-purple-400",
                  title: "Bonos en Especie y Efectivo",
                  desc: "Puedes reclamar tus bonos en piedras preciosas, artículos premium, productos de la tienda o consignaciones en efectivo."
                },
                {
                  icon: Clock,
                  color: "text-blue-400",
                  title: "Ciclos de Pago Mensuales",
                  desc: "Los pagos correspondientes se realizarán de manera fija los primeros 5 días de cada mes y del 15 al 20 de cada mes."
                }
              ].map((rule) => (
                <div key={rule.title} className="flex gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                  <div className="p-2 bg-white/3 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                    <rule.icon className={`w-5 h-5 ${rule.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{rule.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{rule.desc}</p>
                  </div>
                </div>
              ))}

              {/* Promotional disclaimer */}
              <div className="p-3 border border-[hsl(42,68%,50%)/0.2] bg-[hsl(42,68%,50%)/0.04] rounded-xl flex items-center justify-between text-xs mt-3">
                <span className="font-bold text-white">¡Haz crecer tu red hoy mismo!</span>
                <span className="text-[10px] text-muted-foreground">OD - Oro Digital</span>
              </div>

            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}
