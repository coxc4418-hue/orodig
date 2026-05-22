import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(1, "El nombre completo es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [acceptTerms, setAcceptTerms] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", fullName: "", email: "", phone: "", referralCode: "" },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    if (!acceptTerms) {
      toast({ title: "Términos requeridos", description: "Debes aceptar los términos y la política de privacidad.", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ data: { ...values, acceptTerms: true } as typeof values & { acceptTerms: boolean } }, {
      onSuccess: (res) => {
        login(res.token, res.member);
        setLocation("/splash");
      },
      onError: (err: { message?: string }) => {
        toast({
          title: "Error al registrarse",
          description: err.message || "Ocurrió un error durante el registro",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative py-8 overflow-hidden bg-black">
      {/* Same video background as login */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        style={{ opacity: 0.8 }}
      >
        <source src={`${import.meta.env.BASE_URL}login-bg.mp4`} type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto p-6 sm:p-8 rounded-2xl bg-black/70 backdrop-blur-xl border shadow-[0_0_50px_rgba(201,145,26,0.2)]"
        style={{ borderColor: "hsl(42 68% 50% / 0.35)" }}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(201,145,26,0.6)]"
            style={{ color: "hsl(42,68%,50%)" }}>
            ORODIG <span className="text-white">PTS</span>
          </h1>
          <p className="text-white/70 mt-1 text-sm">Únete a la Red Exclusiva</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 text-sm font-semibold">Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} autoComplete="name"
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[hsl(42,68%,50%)] h-10 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 text-sm font-semibold">Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="juan@ejemplo.com" {...field} autoComplete="email"
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[hsl(42,68%,50%)] h-10 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 text-sm font-semibold">Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="tu_usuario" {...field} autoComplete="username"
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[hsl(42,68%,50%)] h-10 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 text-sm font-semibold">Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} autoComplete="new-password"
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[hsl(42,68%,50%)] h-10 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 text-sm font-semibold">Teléfono <span className="text-white/40 font-normal text-xs">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="+52 55 1234 5678" {...field} autoComplete="tel"
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[hsl(42,68%,50%)] h-10 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
            <FormField control={form.control} name="referralCode" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 text-sm font-semibold">Código de Patrocinador <span className="text-white/40 font-normal text-xs">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ej: ADMIN0001" {...field}
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[hsl(42,68%,50%)] h-10 text-sm uppercase" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
            <div className="flex items-start gap-2 pt-1">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} />
              <label htmlFor="terms" className="text-xs text-white/70 leading-snug cursor-pointer">
                Acepto los <Link href="/legal" className="underline" style={{ color: "hsl(42,68%,55%)" }}>términos</Link>
                {" "}y la <Link href="/privacy" className="underline" style={{ color: "hsl(42,68%,55%)" }}>política de privacidad</Link>.
              </label>
            </div>
            <Button
              type="submit"
              disabled={registerMutation.isPending || !acceptTerms}
              className="w-full font-black tracking-widest uppercase h-11 text-black text-sm mt-3"
              style={{
                background: "linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,56%), hsl(42,68%,44%))",
                boxShadow: "0 0 20px hsl(42 68% 50% / 0.4)",
              }}
            >
              {registerMutation.isPending ? "Creando cuenta..." : "CREAR CUENTA GRATIS"}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center">
          <p className="text-white/50 text-xs">
            ¿Ya eres miembro?{" "}
            <Link href="/" className="font-bold underline underline-offset-4 hover:opacity-80"
              style={{ color: "hsl(42,68%,60%)" }}>
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
