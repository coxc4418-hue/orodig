import { useState } from "react";
import { 
  useListWithdrawals, 
  useCreateWithdrawal, 
  getListWithdrawalsQueryKey,
  useListDeposits,
  useCreateDeposit,
  getListDepositsQueryKey,
  getGetMeQueryKey, 
  getGetDashboardSummaryQueryKey 
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownToLine, ArrowUpRight, Wallet, Clock, CheckCircle, XCircle, AlertCircle, Copy, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const GOLD = "hsl(42,68%,50%)";

const ESTADO_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending:  { label: "Pendiente",  icon: Clock,         color: "#888",    bg: "rgba(136,136,136,0.1)" },
  approved: { label: "Aprobado",   icon: CheckCircle,   color: "#00CC66", bg: "rgba(0,204,102,0.1)" },
  paid:     { label: "Pagado",     icon: CheckCircle,   color: "#00CC66", bg: "rgba(0,204,102,0.1)" },
  rejected: { label: "Rechazado",  icon: XCircle,       color: "#FF4444", bg: "rgba(255,68,68,0.1)" },
};

const METODO_LABELS: Record<string, string> = {
  crypto_usdt:    "USDT (TRC20)",
  crypto_btc:     "Bitcoin (BTC)",
  bank_transfer:  "Transferencia Bancaria",
  pago_movil:     "Pago Móvil",
  vault_gems:     "Bóveda (Piedras Preciosas)",
  vault_goods:    "Bóveda (Artículos / Productos)",
  vault_cash:     "Bóveda (Consignación en Efectivo)",
};

export default function Withdrawals() {
  const { currentMember } = useAuth();
  const { data: withdrawals, isLoading: loadingWithdrawals } = useListWithdrawals();
  const { data: deposits, isLoading: loadingDeposits } = useListDeposits();
  const createWithdrawal = useCreateWithdrawal();
  const createDeposit = useCreateDeposit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals">("deposits");
  
  // Withdrawal Form States
  const [wAmount, setWAmount] = useState("");
  const [wMethod, setWMethod] = useState("crypto_usdt");
  const [wAccount, setWAccount] = useState("");

  // Deposit Form States
  const [dAmount, setDAmount] = useState("");
  const [dMethod, setDMethod] = useState("crypto_usdt");
  const [dReference, setDReference] = useState("");

  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (loadingWithdrawals || loadingDeposits || !currentMember) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast({ title: "Copiado", description: `${label} copiado al portapapeles` });
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(wAmount);
    if (isNaN(numAmount) || numAmount < 10) {
      toast({ title: "Monto inválido", description: "El mínimo de retiro es $10", variant: "destructive" });
      return;
    }
    if (numAmount > currentMember.balance) {
      toast({ title: "Saldo insuficiente", description: "El monto supera tu saldo disponible", variant: "destructive" });
      return;
    }
    if (!wAccount.trim()) {
      toast({ title: "Campo requerido", description: "Ingresa la dirección o cuenta de destino", variant: "destructive" });
      return;
    }
    createWithdrawal.mutate({ data: { amount: numAmount, method: wMethod, accountDetails: wAccount } }, {
      onSuccess: () => {
        toast({ title: "¡Solicitud enviada!", description: "Tu retiro está siendo procesado. Tiempo estimado: 24-72 hrs." });
        setWAmount("");
        setWAccount("");
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
      }
    });
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(dAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Monto inválido", description: "Por favor ingresa un monto válido", variant: "destructive" });
      return;
    }
    if (!dReference.trim()) {
      toast({ title: "Referencia requerida", description: "Por favor ingresa el número de referencia/comprobante", variant: "destructive" });
      return;
    }
    createDeposit.mutate({ data: { amount: numAmount, method: dMethod, referenceNumber: dReference } }, {
      onSuccess: () => {
        toast({ title: "¡Notificación enviada!", description: "Tu depósito está pendiente de aprobación por parte del administrador." });
        setDAmount("");
        setDReference("");
        queryClient.invalidateQueries({ queryKey: getListDepositsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo registrar la solicitud de depósito.", variant: "destructive" });
      }
    });
  };

  const pendingWithdrawalTotal = withdrawals?.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0) ?? 0;
  const pendingDepositTotal = deposits?.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CENTRO DE FONDOS</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus depósitos y retiros de forma segura.</p>
        </div>

        {/* Premium Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("deposits")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "deposits" 
                ? "bg-[hsl(42,68%,50%)] text-black shadow-lg" 
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Depósitos
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "withdrawals" 
                ? "bg-[hsl(42,68%,50%)] text-black shadow-lg" 
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Retiros
          </button>
        </div>
      </div>

      {activeTab === "deposits" ? (
        <div className="grid gap-5 md:grid-cols-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Deposit Form & Account details */}
          <div className="md:col-span-2 space-y-4">
            {/* Account Details Box */}
            <Card className="bg-card border-white/5 overflow-hidden">
              <CardHeader className="pb-2 bg-white/2 border-b border-white/5">
                <CardTitle className="text-sm font-black text-white">Datos de Pago de la Empresa</CardTitle>
                <CardDescription className="text-xs">Transfiere los fondos a cualquiera de estas cuentas:</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {dMethod === "crypto_usdt" && (
                  <div className="space-y-2 p-3 rounded-lg border border-white/5 bg-white/2">
                    <p className="font-bold text-[hsl(42,68%,50%)]">USDT (TRC20)</p>
                    <div className="flex items-center justify-between gap-2 bg-black/30 p-2 rounded border border-white/10">
                      <span className="font-mono text-white truncate select-all">TXcompanyUSDTaddressTRC20Here</span>
                      <button 
                        onClick={() => handleCopy("TXcompanyUSDTaddressTRC20Here", "Dirección USDT")}
                        className="text-muted-foreground hover:text-white transition-colors"
                      >
                        {copiedText === "TXcompanyUSDTaddressTRC20Here" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Envía solo USDT mediante la red TRC20 (Tron).</p>
                  </div>
                )}

                {dMethod === "bank_transfer" && (
                  <div className="space-y-2 p-3 rounded-lg border border-white/5 bg-white/2">
                    <p className="font-bold text-[hsl(42,68%,50%)]">Transferencia Nacional (Venezuela)</p>
                    <div className="space-y-1 text-muted-foreground font-mono bg-black/30 p-2.5 rounded border border-white/10">
                      <p><span className="text-white font-semibold">Banco:</span> Mercantil</p>
                      <p><span className="text-white font-semibold">Titular:</span> Oro Digital C.A.</p>
                      <p><span className="text-white font-semibold">RIF:</span> J-50284913-0</p>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-white"><span className="text-muted-foreground">Cuenta:</span> 0105-0024-5110-2451-2364</span>
                        <button 
                          onClick={() => handleCopy("0105-0024-5110-2451-2364", "Número de cuenta")}
                          className="text-muted-foreground hover:text-white transition-colors shrink-0"
                        >
                          {copiedText === "0105-0024-5110-2451-2364" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {dMethod === "pago_movil" && (
                  <div className="space-y-2 p-3 rounded-lg border border-white/5 bg-white/2">
                    <p className="font-bold text-[hsl(42,68%,50%)]">Pago Móvil</p>
                    <div className="space-y-1 text-muted-foreground font-mono bg-black/30 p-2.5 rounded border border-white/10">
                      <p><span className="text-white font-semibold">Banco:</span> Mercantil</p>
                      <p><span className="text-white font-semibold">Teléfono:</span> 0412-555-0192</p>
                      <p><span className="text-white font-semibold">RIF:</span> J-50284913-0</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deposit Notification Form */}
            <Card className="bg-card border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm" style={{ color: GOLD }}>
                  <Wallet className="w-4 h-4" />
                  Notificar Depósito
                </CardTitle>
                <CardDescription className="text-xs">
                  Envía el reporte del pago realizado para acreditar tu saldo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-white/80">Método de depósito</Label>
                    <Select value={dMethod} onValueChange={setDMethod}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-0 focus:border-[hsl(42,68%,50%)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crypto_usdt">USDT (TRC20)</SelectItem>
                        <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                        <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-white/80">Monto depositado (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="100.00"
                        value={dAmount}
                        onChange={(e) => setDAmount(e.target.value)}
                        className="pl-7 bg-white/5 border-white/10 text-white font-mono text-lg focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-white/80">Número de Referencia / Comprobante</Label>
                    <Input
                      placeholder="Ej: 981249 o hash de transacción"
                      value={dReference}
                      onChange={(e) => setDReference(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-mono text-sm focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={createDeposit.isPending}
                    className="w-full font-black tracking-wider uppercase h-11 text-sm text-black"
                    style={{ background: `linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,56%))`, boxShadow: "0 0 15px hsl(42 68% 50% / 0.25)" }}
                  >
                    {createDeposit.isPending ? "Notificando..." : "NOTIFICAR DEPÓSITO"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {pendingDepositTotal > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs text-muted-foreground">Depósitos en espera</p>
                  <p className="text-sm font-black text-white">${pendingDepositTotal.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Deposit History */}
          <Card className="md:col-span-3 bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                Historial de Depósitos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-white/5">
                {deposits && deposits.length > 0 ? deposits.map((d) => {
                  const sCfg = ESTADO_CONFIG[d.status] ?? ESTADO_CONFIG.pending;
                  return (
                    <div key={d.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: sCfg.color, background: sCfg.bg }}>
                          {sCfg.label}
                        </span>
                        <span className="font-black text-white">${d.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">{METODO_LABELS[d.method] ?? d.method}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">Ref: {d.referenceNumber}</p>
                      {d.notes && <p className="text-xs text-amber-500/80 italic font-semibold">Nota: {d.notes}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(d.createdAt), "d MMM yyyy", { locale: es })}</p>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center p-8 gap-2 text-muted-foreground">
                    <ArrowUpRight className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Sin depósitos aún.</p>
                  </div>
                )}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Fecha</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Método</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Referencia</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Estado</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deposits && deposits.length > 0 ? deposits.map((d) => {
                      const sCfg = ESTADO_CONFIG[d.status] ?? ESTADO_CONFIG.pending;
                      const StatusIcon = sCfg.icon;
                      return (
                        <tr key={d.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(d.createdAt), "d MMM yyyy", { locale: es })}</td>
                          <td className="p-3 text-xs font-bold text-muted-foreground">{METODO_LABELS[d.method] ?? d.method}</td>
                          <td className="p-3 font-mono text-xs text-white max-w-[120px] truncate">{d.referenceNumber}</td>
                          <td className="p-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 self-start text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ color: sCfg.color, background: sCfg.bg }}>
                                <StatusIcon className="w-3 h-3" /> {sCfg.label}
                              </span>
                              {d.notes && <span className="text-[10px] text-amber-500/80 italic font-semibold pl-1">Nota: {d.notes}</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black text-white">${d.amount.toFixed(2)}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">Sin solicitudes de depósito aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Withdrawal Form */}
          <div className="md:col-span-2 space-y-4">
            <Card className="bg-card border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm" style={{ color: GOLD }}>
                  <Wallet className="w-4 h-4" />
                  Nueva Solicitud de Retiro
                </CardTitle>
                <CardDescription className="text-xs">
                  Saldo disponible:{" "}
                  <span className="font-black text-white text-sm">${currentMember.balance.toFixed(2)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-white/80">Monto a retirar (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                      <Input
                        type="number"
                        min="10"
                        max={currentMember.balance}
                        step="0.01"
                        placeholder="100.00"
                        value={wAmount}
                        onChange={(e) => setWAmount(e.target.value)}
                        className="pl-7 bg-white/5 border-white/10 text-white font-mono text-lg focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0"
                        required
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      {[25, 50, 100].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setWAmount((currentMember.balance * pct / 100).toFixed(2))}
                          className="flex-1 text-xs py-1 rounded-md border border-white/10 text-muted-foreground hover:border-white/20 hover:text-white transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setWAmount(currentMember.balance.toFixed(2))}
                        className="flex-1 text-xs py-1 rounded-md border border-white/10 text-muted-foreground hover:border-white/20 hover:text-white transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-white/80">Método de pago</Label>
                    <Select value={wMethod} onValueChange={setWMethod}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-0 focus:border-[hsl(42,68%,50%)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crypto_usdt">USDT (TRC20)</SelectItem>
                        <SelectItem value="crypto_btc">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                        <SelectItem value="vault_gems">Bóveda (Piedras Preciosas)</SelectItem>
                        <SelectItem value="vault_goods">Bóveda (Artículos / Productos)</SelectItem>
                        <SelectItem value="vault_cash">Bóveda (Consignación en Efectivo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-white/80">Dirección / Cuenta destino</Label>
                    <Input
                      placeholder={
                        wMethod === "bank_transfer" ? "Número de cuenta / CLABE" : 
                        wMethod.startsWith("vault_") ? "Detalles del retiro o dirección física para envío" : "Dirección de billetera (T...)"
                      }
                      value={wAccount}
                      onChange={(e) => setWAccount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-mono text-sm focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0"
                      required
                    />
                  </div>

                  {/* Info box */}
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-white/5 bg-white/2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Tiempo de procesamiento: <span className="text-white font-semibold">24–72 horas hábiles</span>. Mínimo de retiro: $10 USD.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={createWithdrawal.isPending}
                    className="w-full font-black tracking-wider uppercase h-11 text-sm text-black"
                    style={{ background: `linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,56%))`, boxShadow: "0 0 15px hsl(42 68% 50% / 0.25)" }}
                  >
                    {createWithdrawal.isPending ? "Procesando..." : "SOLICITAR RETIRO"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {pendingWithdrawalTotal > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Retiros en proceso</p>
                  <p className="text-sm font-black text-white">${pendingWithdrawalTotal.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Withdrawal History */}
          <Card className="md:col-span-3 bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
                Historial de Retiros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-white/5">
                {withdrawals && withdrawals.length > 0 ? withdrawals.map((w) => {
                  const sCfg = ESTADO_CONFIG[w.status] ?? ESTADO_CONFIG.pending;
                  return (
                    <div key={w.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: sCfg.color, background: sCfg.bg }}>
                          {sCfg.label}
                        </span>
                        <span className="font-black text-white">${w.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">{METODO_LABELS[w.method] ?? w.method}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{w.accountDetails}</p>
                      {w.notes && <p className="text-xs text-amber-500/80 italic font-semibold">Nota: {w.notes}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(w.createdAt), "d MMM yyyy", { locale: es })}</p>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center p-8 gap-2 text-muted-foreground">
                    <ArrowDownToLine className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Sin solicitudes aún.</p>
                  </div>
                )}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Fecha</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Método</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Destino</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-left">Estado</th>
                      <th className="p-3 text-xs font-bold text-muted-foreground uppercase text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals && withdrawals.length > 0 ? withdrawals.map((w) => {
                      const sCfg = ESTADO_CONFIG[w.status] ?? ESTADO_CONFIG.pending;
                      const StatusIcon = sCfg.icon;
                      return (
                        <tr key={w.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(w.createdAt), "d MMM yyyy", { locale: es })}</td>
                          <td className="p-3 text-xs font-bold text-muted-foreground">{METODO_LABELS[w.method] ?? w.method}</td>
                          <td className="p-3 font-mono text-xs text-white max-w-[120px] truncate">{w.accountDetails}</td>
                          <td className="p-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 self-start text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ color: sCfg.color, background: sCfg.bg }}>
                                <StatusIcon className="w-3 h-3" /> {sCfg.label}
                              </span>
                              {w.notes && <span className="text-[10px] text-amber-500/80 italic font-semibold pl-1">Nota: {w.notes}</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black text-white">${w.amount.toFixed(2)}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">Sin solicitudes de retiro aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
