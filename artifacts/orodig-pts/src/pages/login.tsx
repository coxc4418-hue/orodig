import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token, res.member);
        setLocation("/splash");
      },
      onError: () => {
        toast({
          title: "Acceso denegado",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.85 }}
      >
        <source src={`${import.meta.env.BASE_URL}login-bg.mp4`} type="video/mp4" />
      </video>

      {/* Subtle dark overlay so the card is readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto p-6 sm:p-8 rounded-2xl bg-black/65 backdrop-blur-xl border shadow-[0_0_50px_rgba(201,164,60,0.25)]"
        style={{ borderColor: "hsl(42 68% 50% / 0.35)" }}>
        <div className="text-center mb-7">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(201,164,60,0.6)]"
            style={{ color: "hsl(42,68%,50%)" }}>
            ORODIG <span className="text-white">PTS</span>
          </h1>
          <p className="text-white/80 mt-1 font-medium tracking-wide text-sm">Oro Digital Para Todos</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90 font-semibold">Usuario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingresa tu usuario"
                      {...field}
                      data-testid="input-username"
                      className="bg-black/50 text-white placeholder:text-white/40 focus-visible:ring-[hsl(42,68%,50%)] h-11"
                      style={{ borderColor: "hsl(42 68% 50% / 0.4)" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90 font-semibold">Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      {...field}
                      data-testid="input-password"
                      className="bg-black/50 text-white placeholder:text-white/40 focus-visible:ring-[hsl(42,68%,50%)] h-11"
                      style={{ borderColor: "hsl(42 68% 50% / 0.4)" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              data-testid="button-submit"
              className="w-full font-black tracking-widest uppercase h-12 transition-all text-sm mt-2 text-black"
              style={{
                background: "linear-gradient(135deg, hsl(42,68%,42%), hsl(42,68%,56%), hsl(42,68%,44%))",
                boxShadow: "0 0 25px hsl(42 68% 50% / 0.45)",
              }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Verificando..." : "ACCEDER A LA PLATAFORMA"}
            </Button>
          </form>
        </Form>

        <div className="mt-5 text-center">
          <p className="text-white/60 text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-bold underline underline-offset-4 hover:opacity-80"
              style={{ color: "hsl(42,68%,60%)" }}>
              Únete a la Red
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
