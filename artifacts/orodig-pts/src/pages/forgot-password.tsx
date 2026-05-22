import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getApiBase } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setSent(true);
      toast({ title: "Revisa tu correo", description: data.message });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo enviar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-black/70 border border-white/10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Iniciar sesión
          </Button>
        </Link>
        <h1 className="text-xl font-black text-white mb-2">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Te enviaremos un enlace a tu correo si está registrado.
        </p>
        {sent ? (
          <p className="text-sm text-green-400">Si el correo existe, recibirás instrucciones en breve.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/60 border-white/20 text-white"
              required
            />
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
