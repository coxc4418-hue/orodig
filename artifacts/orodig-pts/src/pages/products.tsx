import { useListProducts, useCreatePurchase } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Products() {
  const { data: products, isLoading } = useListProducts();
  const purchaseMutation = useCreatePurchase();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="text-primary">Loading digital assets...</div>;
  }

  const handlePurchase = (productId: number) => {
    purchaseMutation.mutate({ data: { productId, quantity: 1 } }, {
      onSuccess: () => {
        toast({
          title: "Purchase Successful",
          description: "Asset added to your portfolio.",
          className: "bg-black border-primary text-white",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
      onError: (err) => {
        toast({
          title: "Purchase Failed",
          description: err.message || "Insufficient balance or error.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">MARKETPLACE</h1>
        <p className="text-muted-foreground">Invest in digital assets to multiply your points.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products?.filter(p => p.isActive).map((product) => (
          <Card key={product.id} className="bg-card border-border/50 overflow-hidden flex flex-col group hover:border-primary/50 transition-colors">
            <div className="h-48 bg-secondary flex items-center justify-center relative overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-black to-slate-900 flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-muted/20" />
                </div>
              )}
              <Badge className="absolute top-4 right-4 bg-primary text-black font-black uppercase tracking-wider">
                {product.category}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground text-sm line-clamp-3">{product.description}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Price</div>
                  <div className="text-2xl font-black text-white">${product.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Reward</div>
                  <div className="text-lg font-bold text-purple-400 flex items-center gap-1">
                    <Zap className="w-4 h-4" /> {product.pointsReward} pts
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                onClick={() => handlePurchase(product.id)}
                disabled={purchaseMutation.isPending}
                className="w-full bg-white text-black hover:bg-primary font-black tracking-widest uppercase transition-colors"
              >
                {purchaseMutation.isPending ? "Processing..." : "Acquire Asset"}
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {(!products || products.length === 0) && (
          <div className="col-span-full text-center p-12 border border-dashed border-border/50 rounded-xl text-muted-foreground">
            No assets currently available in the marketplace.
          </div>
        )}
      </div>
    </div>
  );
}
