import { useListProducts, useCreatePurchase, getGetDashboardSummaryQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
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
    return <div className="text-primary font-bold animate-pulse pt-4">Cargando productos...</div>;
  }

  const handlePurchase = (productId: number) => {
    purchaseMutation.mutate({ data: { productId, quantity: 1 } }, {
      onSuccess: () => {
        toast({
          title: "Compra Exitosa",
          description: "Puntos acreditados a tu cuenta.",
          className: "bg-black border-primary text-white",
        });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({
          title: "Error en la compra",
          description: "Saldo insuficiente u ocurrió un error.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">TIENDA DE PRODUCTOS</h1>
        <p className="text-muted-foreground text-sm">Compra productos y acumula puntos para ganar más.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {products?.filter(p => p.isActive).map((product) => (
          <Card key={product.id} data-testid={`card-product-${product.id}`} className="bg-card border-border/50 overflow-hidden flex flex-col group hover:border-primary/50 transition-colors">
            <div className="h-36 sm:h-44 bg-secondary flex items-center justify-center relative overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-black to-slate-900 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
              <Badge className="absolute top-3 right-3 bg-primary text-black font-black uppercase tracking-wider text-[10px]">
                {product.category}
              </Badge>
            </div>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-base font-bold text-white">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <p className="text-muted-foreground text-xs line-clamp-2">{product.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Precio</div>
                  <div className="text-xl font-black text-white">${product.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Recompensa</div>
                  <div className="text-base font-bold text-purple-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> {product.pointsReward} pts
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                onClick={() => handlePurchase(product.id)}
                disabled={purchaseMutation.isPending}
                data-testid={`button-buy-${product.id}`}
                className="w-full bg-primary hover:bg-primary/90 text-black font-black tracking-widest uppercase transition-colors h-10"
              >
                {purchaseMutation.isPending ? "Procesando..." : "COMPRAR"}
              </Button>
            </CardFooter>
          </Card>
        ))}

        {(!products || products.length === 0) && (
          <div className="col-span-full text-center p-10 border border-dashed border-border/50 rounded-xl text-muted-foreground text-sm">
            No hay productos disponibles en este momento.
          </div>
        )}
      </div>
    </div>
  );
}
