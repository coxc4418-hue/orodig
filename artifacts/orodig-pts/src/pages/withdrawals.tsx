import { useState } from "react";
import { useListWithdrawals, useCreateWithdrawal, getListWithdrawalsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownToLine, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const ESTADO_LABELS: Record<string, string> = {
  paid: "Pagado",
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "Pendiente",
};

const METODO_LABELS: Record<string, string> = {
  crypto_usdt: "USDT (TRC20)",
  crypto_btc: "Bitcoin (BTC)",
  bank_transfer: "Transferencia Bancaria",
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
    return <div className="text-primary font-bold animate-pulse pt-4">Cargando retiros...</div>;
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

    createWithdrawal.mutate({ data: { amount: numAmount, method, accountDetails: account } }, {
      onSuccess: () => {
        toast({ title: "Solicitud Enviada", description: "Tu retiro está siendo procesado." });
        setAmount("");
        setAccount("");
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "approved": return "bg-primary/20 text-primary border-primary/50";
      case "rejected": return "bg-destructive/20 text-destructive border-destructive/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">RETIROS</h1>
        <p className="text-muted-foreground text-sm">Extrae tu riqueza acumulada.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Wallet className="w-4 h-4 text-primary" />
              Solicitar Retiro
            </CardTitle>
            <CardDescription>Disponible: <span className="font-bold text-white">${currentMember.balance.toFixed(2)}</span></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-sm font-semibold">Monto (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                  className="bg-background/50 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="method" className="text-sm font-semibold">Método de Pago</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-background/50 text-white" data-testid="select-method">
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
                <Label htmlFor="account" className="text-sm font-semibold">Dirección / Cuenta Destino</Label>
                <Input
                  id="account"
                  placeholder="T..."
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  data-testid="input-account"
                  className="bg-background/50 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={createWithdrawal.isPending}
                data-testid="button-withdraw"
                className="w-full bg-primary hover:bg-primary/90 text-black font-black tracking-widest uppercase shadow-[0_0_15px_rgba(255,215,0,0.2)] h-11"
              >
                {createWithdrawal.isPending ? "Procesando..." : "SOLICITAR RETIRO"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
              Historial de Retiros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-border/50">
              {withdrawals && withdrawals.length > 0 ? withdrawals.map((w) => (
                <div key={w.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`uppercase text-[9px] font-bold tracking-wider ${getStatusColor(w.status)}`}>
                      {ESTADO_LABELS[w.status] ?? w.status}
                    </Badge>
                    <span className="font-black text-white">${w.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">{METODO_LABELS[w.method] ?? w.method}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(w.createdAt), "d MMM yyyy", { locale: es })}</p>
                </div>
              )) : (
                <div className="text-center p-8 text-muted-foreground text-sm">Sin solicitudes de retiro aún.</div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background/50">
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 font-bold text-muted-foreground">Fecha</th>
                    <th className="text-left p-3 font-bold text-muted-foreground">Método</th>
                    <th className="text-left p-3 font-bold text-muted-foreground">Destino</th>
                    <th className="text-left p-3 font-bold text-muted-foreground">Estado</th>
                    <th className="text-right p-3 font-bold text-muted-foreground">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals && withdrawals.length > 0 ? withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-border/30 hover:bg-background/50 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs">{format(new Date(w.createdAt), "d MMM yyyy", { locale: es })}</td>
                      <td className="p-3 text-xs font-bold text-muted-foreground uppercase">{METODO_LABELS[w.method] ?? w.method}</td>
                      <td className="p-3 font-mono text-xs text-white max-w-[120px] truncate">{w.accountDetails}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`uppercase text-[9px] font-bold tracking-wider ${getStatusColor(w.status)}`}>
                          {ESTADO_LABELS[w.status] ?? w.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-black text-white">${w.amount.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">Sin solicitudes de retiro aún.</td>
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
