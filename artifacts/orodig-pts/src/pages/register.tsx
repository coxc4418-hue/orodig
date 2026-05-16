import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import loginBg from "@assets/image_1778968907902.png";

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

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", fullName: "", email: "", phone: "", referralCode: "" },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token, res.member);
        setLocation("/dashboard");
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
    <div className="min-h-screen w-full flex items-center justify-center relative py-8 overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})`, opacity: 0.85 }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto p-6 sm:p-8 rounded-2xl bg-black/65 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(255,215,0,0.2)]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
            ORODIG <span className="text-white">PTS</span>
          </h1>
          <p className="text-white/80 mt-1 font-medium tracking-wide text-sm">Únete a la Red Exclusiva</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 font-semibold">Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} data-testid="input-fullname" className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 font-semibold">Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="juan@ejemplo.com" {...field} data-testid="input-email" className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 font-semibold">Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="Elige un usuario" {...field} data-testid="input-username" className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 font-semibold">Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} data-testid="input-password" className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 font-semibold">Teléfono <span className="text-white/40 font-normal">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="+52 55 1234 5678" {...field} data-testid="input-phone" className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="referralCode" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90 font-semibold">Código de Patrocinador <span className="text-white/40 font-normal">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="¿Quién te invitó?" {...field} data-testid="input-referral" className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-10 uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button
              type="submit"
              data-testid="button-register"
              className="w-full bg-primary hover:bg-primary/90 text-black font-black tracking-widest uppercase h-12 shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all mt-4"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creando cuenta..." : "CREAR CUENTA"}
            </Button>
          </form>
        </Form>

        <div className="mt-5 text-center">
          <p className="text-white/60 text-sm">
            ¿Ya eres miembro?{" "}
            <Link href="/" className="text-primary hover:text-primary/80 font-bold underline underline-offset-4">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
