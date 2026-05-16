import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-7xl font-black text-primary drop-shadow-[0_0_20px_rgba(201,145,26,0.5)] mb-2">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Página no encontrada</h2>
          <p className="text-muted-foreground text-sm">La página que buscas no existe o fue movida.</p>
        </div>
        <Button asChild className="font-bold uppercase tracking-wider">
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Volver al Panel
          </Link>
        </Button>
      </div>
    </div>
  );
}
