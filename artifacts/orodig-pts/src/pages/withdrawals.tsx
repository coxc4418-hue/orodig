import { useState } from "react";
import { useListWithdrawals, useCreateWithdrawal, getListWithdrawalsQueryKey, getGetMeQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownToLine, Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const GOLD = "hsl(42,68%,50%)";

const ESTADO_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending:  { label: "Pendiente",  icon: Clock,         color: "#888",    bg: "rgba(136,136,136,0.1)" },
  approved: { label: "Aprobado",   icon: CheckCircle,   color: GOLD,      bg: "hsl(42 68% 50% / 0.1)" },
  paid:     { label: "Pagado",     icon: CheckCircle,   color: "#00CC66", bg: "rgba(0,204,102,0.1)" },
  rejected: { label: "Rechazado",  icon: XCircle,       color: "#FF4444", bg: "rgba(255,68,68,0.1)" },
};

const METODO_LABELS: Record<string, string> = {
  crypto_usdt:    "USDT (TRC20)",
  crypto_btc:     "Bitcoin (BTC)",
  bank_transfer:  "Transferencia Bancaria",
};

export default function Withdrawals() {
  const { currentMember } = useAuth();
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("crypto_usdt");
  const [account, setAccount] = useState("");

  if (isLoading || !currentMember) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      toast({ title: "Monto inválido", description: "El mínimo de retiro es $10", variant: "destructive" });
      return;
    }
    if (numAmount > currentMember.balance) {
      toast({ title: "Saldo insuficiente", description: "El monto supera tu saldo disponible", variant: "destructive" });
      return;
    }
    if (!account.trim()) {
      toast({ title: "Campo requerido", description: "Ingresa la dirección o cuenta de destino", variant: "destructive" });
      return;
    }
    createWithdrawal.mutate({ data: { amount: numAmount, method, accountDetails: account } }, {
      onSuccess: () => {
        toast({ title: "¡Solicitud enviada!", description: "Tu retiro está siendo procesado. Tiempo estimado: 24-72 hrs." });
        setAmount("");
        setAccount("");
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
      }
    });
  };

  const pendingTotal = withdrawals?.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">RETIROS</h1>
        <p className="text-muted-foreground text-sm">Extrae tus ganancias acumuladas de forma segura.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {/* Form */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm" style={{ color: GOLD }}>
                <Wallet className="w-4 h-4" />
                Nueva Solicitud
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7 bg-white/5 border-white/10 text-white font-mono text-lg focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0"
                      required
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    {[25, 50, 100].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAmount((currentMember.balance * pct / 100).toFixed(2))}
                        className="flex-1 text-xs py-1 rounded-md border border-white/10 text-muted-foreground hover:border-white/20 hover:text-white transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(currentMember.balance.toFixed(2))}
                      className="flex-1 text-xs py-1 rounded-md border border-white/10 text-muted-foreground hover:border-white/20 hover:text-white transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-white/80">Método de pago</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-0 focus:border-[hsl(42,68%,50%)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto_usdt">USDT (TRC20)</SelectItem>
                      <SelectItem value="crypto_btc">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-white/80">Dirección / Cuenta destino</Label>
                  <Input
                    placeholder={method === "bank_transfer" ? "Número de cuenta / CLABE" : "T..."}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
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

          {/* Stats card */}
          {pendingTotal > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">En proceso</p>
                <p className="text-sm font-black text-white">${pendingTotal.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* History */}
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ color: sCfg.color, background: sCfg.bg }}>
                            <StatusIcon className="w-3 h-3" /> {sCfg.label}
                          </span>
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
    </div>
  );
}
