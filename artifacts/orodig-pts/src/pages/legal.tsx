import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOLD = "hsl(42,68%,50%)";

export default function Legal() {
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">
      <Link href="/register">
        <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </Link>
      <h1 className="text-3xl font-black mb-2" style={{ color: GOLD }}>Términos de uso</h1>
      <p className="text-sm text-muted-foreground mb-8">Última actualización: mayo 2026</p>

      <div className="space-y-4 text-sm text-white/80 leading-relaxed">
        <p>
          ORODIG PTS es una plataforma de red de mercadeo. Al registrarte aceptas participar bajo las reglas del plan de compensación publicado en la aplicación.
        </p>
        <p>
          Los depósitos, retiros y comisiones requieren verificación administrativa. No garantizamos ingresos: los resultados dependen de tu actividad y la de tu red.
        </p>
        <p>
          Eres responsable de la veracidad de tus datos y del cumplimiento de leyes fiscales locales. La plataforma puede suspender cuentas por fraude o incumplimiento.
        </p>
        <p>
          Para soporte: contacta al administrador de tu línea o al equipo ORODIG a través de los canales oficiales de la comunidad.
        </p>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        También revisa nuestra <Link href="/privacy" className="underline" style={{ color: GOLD }}>política de privacidad</Link>.
      </p>
    </div>
  );
}
