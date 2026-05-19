import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RankBadge } from "@/components/layout";
import {
  useAdminGetStats,
  useAdminListWithdrawals,
  useAdminUpdateWithdrawal,
  useAdminListProducts,
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useAdminListMembers,
  useAdminUpdateMember,
  useListEarnings,
  useAdminListDeposits,
  useAdminUpdateDeposit,
  getAdminListDepositsQueryKey,
  useAdminListPurchases,
  useAdminUpdatePurchase,
  getAdminListPurchasesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListWithdrawalsQueryKey, getAdminListProductsQueryKey, getAdminListMembersQueryKey, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import {
  Users, DollarSign, TrendingUp, ArrowDownToLine,
  ShoppingBag, CheckCircle, XCircle, Clock, ChevronRight,
  Shield, Plus, Edit, ToggleLeft, ToggleRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

const METODO_LABELS: Record<string, string> = {
  crypto_usdt:    "USDT (TRC20)",
  crypto_btc:     "Bitcoin (BTC)",
  bank_transfer:  "Transferencia Bancaria",
  pago_movil:     "Pago Móvil",
  vault_gems:     "Bóveda (Piedras Preciosas)",
  vault_goods:    "Bóveda (Artículos / Productos)",
  vault_cash:     "Bóveda (Consignación en Efectivo)",
};

const GOLD = "hsl(42,68%,50%)";
const TABS = ["Estadísticas", "Depósitos", "Retiros", "Compras", "Productos", "Miembros"] as const;
type Tab = typeof TABS[number];

export default function Admin() {
  const { currentMember } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("Estadísticas");
  const qc = useQueryClient();

  useEffect(() => {
    if (currentMember && currentMember.username !== "admin") {
      setLocation("/dashboard");
    }
  }, [currentMember, setLocation]);

  const { data: stats } = useAdminGetStats();
  const { data: withdrawals } = useAdminListWithdrawals();
  const { data: deposits } = useAdminListDeposits();
  const { data: purchases } = useAdminListPurchases();
  const { data: products } = useAdminListProducts();
  const { data: members } = useAdminListMembers();

  const updateWithdrawal = useAdminUpdateWithdrawal({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListWithdrawalsQueryKey() }) },
  });
  const updateDeposit = useAdminUpdateDeposit({
    mutation: { 
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminListDepositsQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminListMembersQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      } 
    },
  });
  const updatePurchase = useAdminUpdatePurchase({
    mutation: { 
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminListPurchasesQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminListMembersQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      } 
    },
  });
  const createProduct = useAdminCreateProduct({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListProductsQueryKey() }) },
  });
  const updateProduct = useAdminUpdateProduct({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListProductsQueryKey() }) },
  });
  const updateMember = useAdminUpdateMember({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminListMembersQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
    },
  });

  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", pointsReward: "", category: "pack" });
  const [showProductForm, setShowProductForm] = useState(false);

  if (!currentMember || currentMember.username !== "admin") return null;

  const handleApproveWithdrawal = (id: number, status: "approved" | "rejected" | "paid") => {
    updateWithdrawal.mutate({ id, data: { status } });
  };

  const handleApproveDeposit = (id: number, status: "approved" | "rejected") => {
    updateDeposit.mutate({ id, data: { status } });
  };

  const handleApprovePurchase = (id: number, status: "approved" | "rejected") => {
    updatePurchase.mutate({ id, data: { status } });
  };

  const handleToggleMember = (id: number, isActive: boolean) => {
    updateMember.mutate({ id, data: { isActive: !isActive } });
  };

  const handleToggleProduct = (id: number, product: any) => {
    updateProduct.mutate({
      id,
      data: {
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        pointsReward: product.pointsReward ?? 0,
        category: product.category,
        isActive: !product.isActive,
      },
    });
  };

  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    createProduct.mutate({
      data: {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        pointsReward: parseInt(newProduct.pointsReward) || 0,
        category: newProduct.category,
        isActive: true,
      },
    });
    setNewProduct({ name: "", description: "", price: "", pointsReward: "", category: "pack" });
    setShowProductForm(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendiente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
      approved: { label: "Aprobado", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      paid: { label: "Pagado", className: "bg-green-500/20 text-green-300 border-green-500/30" },
      rejected: { label: "Rechazado", className: "bg-red-500/20 text-red-300 border-red-500/30" },
    };
    const s = map[status] ?? { label: status, className: "" };
    return <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider border ${s.className}`}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(273,100%,30%), hsl(273,100%,45%))" }}>
          <Shield className="w-5 h-5 text-purple-200" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">PANEL ADMIN</h1>
          <p className="text-muted-foreground text-sm">Control total de la plataforma ORODIG PTS.</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab ? "text-black" : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab ? { background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ESTADÍSTICAS */}
      {activeTab === "Estadísticas" && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Total Miembros", value: stats.totalMembers, sub: `${stats.activeMembers} activos` },
              { icon: TrendingUp, label: "Volumen Total", value: `$${Number(stats.totalVolume ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`, sub: "en ganancias" },
              { icon: DollarSign, label: "Total Pagado", value: `$${Number(stats.totalPaid ?? 0).toFixed(0)}`, sub: "retiros pagados" },
              { icon: ArrowDownToLine, label: "Retiros Pend.", value: stats.pendingWithdrawals, sub: `$${Number(stats.pendingAmount ?? 0).toFixed(0)} pendiente` },
            ].map(({ icon: Icon, label, value, sub }) => (
              <Card key={label} className="bg-card border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ background: GOLD }} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                  </div>
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rank breakdown */}
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: GOLD }} />
                Distribución por Rango
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(stats.rankBreakdown ?? {}).map(([rank, count]) => (
                  <div key={rank} className="text-center p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="text-lg font-black text-white">{count as number}</div>
                    <RankBadge rank={rank} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DEPÓSITOS */}
      {activeTab === "Depósitos" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {(!deposits || (deposits as any[]).length === 0) ? (
            <Card className="bg-card border-white/5">
              <CardContent className="py-12 text-center">
                <ArrowDownToLine className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40 animate-pulse" />
                <p className="text-muted-foreground text-sm">No hay reportes de depósito.</p>
              </CardContent>
            </Card>
          ) : (
            (deposits as any[]).map((d) => (
              <Card key={d.id} className="bg-card border-white/5 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-bold">{d.memberName ?? `#${d.memberId}`}</span>
                        {d.memberUsername && <span className="text-xs text-muted-foreground">(@{d.memberUsername})</span>}
                        {statusBadge(d.status)}
                      </div>
                      <div className="text-2xl font-black text-green-400">${Number(d.amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1.5 font-mono space-y-1 bg-black/20 p-2.5 rounded border border-white/5">
                        <p><span className="text-white font-semibold">Método:</span> {METODO_LABELS[d.method] ?? d.method}</p>
                        <p><span className="text-white font-semibold">Referencia:</span> {d.referenceNumber}</p>
                        <p className="text-[10px] text-muted-foreground pt-1 border-t border-white/5 mt-1">{format(new Date(d.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
                      </div>
                    </div>
                    {d.status === "pending" && (
                      <div className="flex gap-2 flex-wrap self-center">
                        <Button size="sm" className="text-xs font-bold h-8 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproveDeposit(d.id, "approved")}
                          disabled={updateDeposit.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs font-bold h-8"
                          onClick={() => handleApproveDeposit(d.id, "rejected")}
                          disabled={updateDeposit.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* RETIROS */}
      {activeTab === "Retiros" && (
        <div className="space-y-3">
          {(!withdrawals || (withdrawals as any[]).length === 0) ? (
            <Card className="bg-card border-white/5">
              <CardContent className="py-12 text-center">
                <ArrowDownToLine className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground text-sm">No hay solicitudes de retiro.</p>
              </CardContent>
            </Card>
          ) : (
            (withdrawals as any[]).map((w) => (
              <Card key={w.id} className="bg-card border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{w.memberName ?? `#${w.memberId}`}</span>
                        {statusBadge(w.status)}
                      </div>
                      <div className="text-2xl font-black" style={{ color: GOLD }}>${Number(w.amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(w.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                        {w.method && ` · ${w.method}`}
                        {w.accountInfo && ` · ${w.accountInfo}`}
                      </div>
                    </div>
                    {w.status === "pending" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" className="text-xs font-bold h-8 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproveWithdrawal(w.id, "approved")}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs font-bold h-8"
                          onClick={() => handleApproveWithdrawal(w.id, "rejected")}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                        </Button>
                      </div>
                    )}
                    {w.status === "approved" && (
                      <Button size="sm" className="text-xs font-bold h-8 text-black"
                        style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` }}
                        onClick={() => handleApproveWithdrawal(w.id, "paid")}>
                        <DollarSign className="w-3.5 h-3.5 mr-1" /> Marcar Pagado
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* COMPRAS */}
      {activeTab === "Compras" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {(!purchases || (purchases as any[]).length === 0) ? (
            <Card className="bg-card border-white/5">
              <CardContent className="py-12 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40 animate-pulse" />
                <p className="text-muted-foreground text-sm">No hay reportes de compras.</p>
              </CardContent>
            </Card>
          ) : (
            (purchases as any[]).map((p) => (
              <Card key={p.id} className="bg-card border-white/5 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{p.memberName ?? `#${p.memberId}`}</span>
                        <span className="text-xs text-muted-foreground">(@{p.memberUsername})</span>
                        {statusBadge(p.status)}
                      </div>
                      <div className="text-2xl font-black" style={{ color: GOLD }}>${Number(p.totalPrice).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(p.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                        {` · Producto: ${p.productName} (x${p.quantity}) · Puntos: +${p.pointsEarned}`}
                      </div>
                      {p.notes && (
                        <div className="text-xs text-yellow-300 bg-yellow-500/10 rounded-lg p-2 mt-2 border border-yellow-500/20">
                          <strong>Notas:</strong> {p.notes}
                        </div>
                      )}
                    </div>

                    {p.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                          onClick={() => handleApprovePurchase(p.id, "approved")}
                          disabled={updatePurchase.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-bold"
                          onClick={() => handleApprovePurchase(p.id, "rejected")}
                          disabled={updatePurchase.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* PRODUCTOS */}
      {activeTab === "Productos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              className="text-xs font-bold h-9 text-black"
              style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` }}
              onClick={() => setShowProductForm(!showProductForm)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Producto
            </Button>
          </div>

          {showProductForm && (
            <Card className="bg-card border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Crear Nuevo Producto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nombre *</label>
                    <input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Pack Oro"
                      className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Precio ($) *</label>
                    <input
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="99.99"
                      type="number"
                      className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Puntos</label>
                    <input
                      value={newProduct.pointsReward}
                      onChange={(e) => setNewProduct({ ...newProduct, pointsReward: e.target.value })}
                      placeholder="1000"
                      type="number"
                      className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Categoría</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                    >
                      <option value="pack">Pack</option>
                      <option value="producto">Producto</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Descripción</label>
                  <input
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Descripción del producto..."
                    className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowProductForm(false)}>Cancelar</Button>
                  <Button size="sm" className="text-xs font-bold text-black"
                    style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` }}
                    onClick={handleCreateProduct} disabled={createProduct.isPending}>
                    {createProduct.isPending ? "Creando..." : "Crear Producto"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(products as any[] ?? []).map((p) => (
            <Card key={p.id} className="bg-card border-white/5">
              <CardContent className="p-4 flex items-center gap-3 flex-wrap justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm">{p.name}</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider border border-white/10 text-muted-foreground">
                      {p.category}
                    </Badge>
                    {p.isActive ? (
                      <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider border-green-500/30 text-green-300 bg-green-500/10">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider border-red-500/30 text-red-300 bg-red-500/10">Inactivo</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg font-black" style={{ color: GOLD }}>${Number(p.price).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{p.pointsReward?.toLocaleString()} pts</span>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 shrink-0"
                  onClick={() => handleToggleProduct(p.id, p)}
                  disabled={updateProduct.isPending}
                >
                  {p.isActive
                    ? <><ToggleRight className="w-4 h-4 mr-1 text-green-400" /> Desactivar</>
                    : <><ToggleLeft className="w-4 h-4 mr-1 text-muted-foreground" /> Activar</>
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MIEMBROS */}
      {activeTab === "Miembros" && (
        <div className="space-y-3">
          {(members as any[] ?? []).map((m) => (
            <Card key={m.id} className="bg-card border-white/5">
              <CardContent className="p-4 flex items-center gap-3 flex-wrap justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-black shrink-0"
                    style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))` }}>
                    {(m.fullName ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">{m.fullName}</span>
                      <RankBadge rank={m.rank} />
                      {!m.isActive && (
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider border-red-500/30 text-red-300 bg-red-500/10">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">@{m.username}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-xs font-bold" style={{ color: GOLD }}>${Number(m.totalEarnings ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{m.directReferrals} directos</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 shrink-0"
                  onClick={() => handleToggleMember(m.id, m.isActive)}
                  disabled={updateMember.isPending}
                >
                  {m.isActive
                    ? <><ToggleRight className="w-4 h-4 mr-1 text-green-400" /> Desactivar</>
                    : <><ToggleLeft className="w-4 h-4 mr-1 text-muted-foreground" /> Activar</>
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
