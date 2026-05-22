import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOLD = "hsl(42,68%,50%)";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">
      <Link href="/register">
        <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </Link>
      <h1 className="text-3xl font-black mb-2" style={{ color: GOLD }}>Política de privacidad</h1>
      <p className="text-sm text-muted-foreground mb-8">Última actualización: mayo 2026</p>

      <div className="space-y-4 text-sm text-white/80 leading-relaxed">
        <p>
          Recopilamos nombre, correo, teléfono, datos de red y actividad en la plataforma para operar el servicio MLM, procesar depósitos/retiros y comunicarnos contigo.
        </p>
        <p>
          Los datos se almacenan en Firebase (Google Cloud) y el servidor API en Render. No vendemos tu información a terceros con fines publicitarios.
        </p>
        <p>
          Las imágenes de comunidad se guardan en Firebase Storage. Las contraseñas se almacenan cifradas; el acceso usa tokens de sesión.
        </p>
        <p>
          Puedes solicitar corrección o eliminación de tu cuenta contactando al administrador. Algunos registros financieros pueden conservarse por obligaciones legales.
        </p>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Ver <Link href="/legal" className="underline" style={{ color: GOLD }}>términos de uso</Link>.
      </p>
    </div>
  );
}
