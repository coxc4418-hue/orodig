import { useState } from "react";
import { useListWithdrawals, useCreateWithdrawal } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowDownToLine, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
    return <div className="text-primary">Loading treasury...</div>;
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < 10) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is $10", variant: "destructive" });
      return;
    }

    if (numAmount > currentMember.balance) {
      toast({ title: "Insufficient funds", description: "Amount exceeds available balance", variant: "destructive" });
      return;
    }

    createWithdrawal.mutate({
      data: {
        amount: numAmount,
        method,
        accountDetails: account
      }
    }, {
      onSuccess: () => {
        toast({ title: "Request Submitted", description: "Your withdrawal is being processed." });
        setAmount("");
        setAccount("");
        queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
      onError: (err) => {
        toast({ title: "Request Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'approved': return 'bg-primary/20 text-primary border-primary/50';
      case 'rejected': return 'bg-destructive/20 text-destructive border-destructive/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">TREASURY</h1>
        <p className="text-muted-foreground">Extract your accumulated wealth.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card border-border/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Request Extraction
            </CardTitle>
            <CardDescription>Available: <span className="font-bold text-white">${currentMember.balance.toFixed(2)}</span></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  min="10" 
                  step="0.01" 
                  placeholder="100.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/50 text-white font-mono text-lg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="method">Transfer Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-background/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto_usdt">USDT (TRC20)</SelectItem>
                    <SelectItem value="crypto_btc">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Destination Address / Account</Label>
                <Input 
                  id="account" 
                  placeholder="T..." 
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="bg-background/50 text-white"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={createWithdrawal.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase mt-4 shadow-[0_0_15px_rgba(255,215,0,0.2)]"
              >
                {createWithdrawal.isPending ? "Processing..." : "Extract Funds"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-muted-foreground" />
              Extraction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-background/50">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Method</TableHead>
                    <TableHead className="font-bold">Destination</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals && withdrawals.length > 0 ? withdrawals.map((w) => (
                    <TableRow key={w.id} className="border-border/50 hover:bg-background/50">
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(w.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="uppercase text-xs font-bold tracking-wider text-muted-foreground">
                        {w.method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white max-w-[150px] truncate">
                        {w.accountDetails}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`uppercase text-[10px] font-bold tracking-wider ${getStatusColor(w.status)}`}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-white">
                        ${w.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                        No extraction requests yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
