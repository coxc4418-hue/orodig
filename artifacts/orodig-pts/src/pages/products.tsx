import { useListProducts, useCreatePurchase, getGetDashboardSummaryQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Zap, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const GOLD = "hsl(42,68%,50%)";

const CATEGORY_COLORS: Record<string, string> = {
  digital:   GOLD,
  education: "#00CCFF",
  business:  "#9933FF",
  health:    "#00CC66",
  trading:   "#FF6600",
};

export default function Products() {
  const { data: products, isLoading } = useListProducts();
  const purchaseMutation = useCreatePurchase();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [justBought, setJustBought] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  const handlePurchase = (productId: number) => {
    purchaseMutation.mutate({ data: { productId, quantity: 1 } }, {
      onSuccess: () => {
        setJustBought(productId);
        setTimeout(() => setJustBought(null), 3000);
        toast({
          title: "Compra registrada",
          description: "Tu saldo fue debitado. Los puntos y comisiones se acreditan cuando el administrador apruebe la compra.",
          className: "border-green-500/30 bg-black text-white",
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

  const activeProducts = products?.filter(p => p.isActive) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">TIENDA DE PRODUCTOS</h1>
        <p className="text-muted-foreground text-sm">Invierte en productos digitales y acumula puntos para ascender de rango.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl border"
        style={{ borderColor: "hsl(42 68% 50% / 0.25)", background: "hsl(42 68% 50% / 0.06)" }}>
        <Zap className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
        <p className="text-xs text-muted-foreground">
          Cada compra genera <span className="font-bold text-white">puntos de recompensa</span> y activa{" "}
          <span className="font-bold text-white">comisiones para tu patrocinador</span>.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {activeProducts.map((product) => {
          const catColor = CATEGORY_COLORS[product.category?.toLowerCase()] ?? GOLD;
          const isBought = justBought === product.id;

          return (
            <Card key={product.id}
              className="bg-card border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all"
              style={isBought ? { borderColor: "#00CC6640", boxShadow: "0 0 20px rgba(0,204,102,0.1)" } : {}}>

              {/* Product image / placeholder */}
              <div className="h-36 sm:h-40 relative overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${catColor}25`, color: catColor, border: `1px solid ${catColor}40` }}>
                  {product.category}
                </div>
              </div>

              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-base font-bold text-white leading-tight">{product.name}</CardTitle>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                <p className="text-muted-foreground text-xs line-clamp-2 mb-4">{product.description}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Precio</div>
                    <div className="text-2xl font-black text-white">${product.price.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Puntos</div>
                    <div className="flex items-center gap-1 font-bold justify-end" style={{ color: "#9933FF" }}>
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-base">{product.pointsReward}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-4 px-4">
                <Button
                  onClick={() => handlePurchase(product.id)}
                  disabled={purchaseMutation.isPending}
                  className="w-full font-black tracking-wider uppercase h-10 text-sm transition-all"
                  style={isBought
                    ? { background: "#00CC66", color: "white" }
                    : { background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,56%))`, color: "black" }
                  }
                >
                  {isBought
                    ? <><CheckCircle className="w-4 h-4 mr-1.5" /> ¡Comprado!</>
                    : purchaseMutation.isPending ? "Procesando..." : "COMPRAR AHORA"
                  }
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {activeProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl text-muted-foreground gap-3">
            <ShoppingBag className="w-10 h-10 opacity-30" />
            <p className="text-sm">No hay productos disponibles en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
