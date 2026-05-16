import { useListEarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { History } from "lucide-react";

export default function Earnings() {
  const { data: earnings, isLoading } = useListEarnings();

  if (isLoading) {
    return <div className="text-primary">Loading financial ledger...</div>;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'referral': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'sales': return 'bg-purple-500/20 text-purple-500 border-purple-500/50';
      case 'purchases': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'leadership': return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/50';
      case 'work': return 'bg-pink-500/20 text-pink-500 border-pink-500/50';
      case 'passive': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400';
      case 'confirmed': return 'text-primary';
      case 'pending': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">EARNINGS LEDGER</h1>
        <p className="text-muted-foreground">Track every cent of your wealth generation.</p>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings && earnings.length > 0 ? earnings.map((earning) => (
                  <TableRow key={earning.id} className="border-border/50 hover:bg-background/50">
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(earning.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`uppercase text-[10px] font-bold tracking-wider ${getTypeColor(earning.type)}`}>
                        {earning.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {earning.description}
                      {earning.relatedMemberName && (
                        <span className="text-xs text-muted-foreground ml-2">from @{earning.relatedMemberName}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs uppercase font-bold tracking-wider ${getStatusColor(earning.status)}`}>
                        {earning.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-white">
                      ${earning.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                      No earnings recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
