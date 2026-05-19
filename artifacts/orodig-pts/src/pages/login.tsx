import { useState } from "react";
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
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const DEMO_USERS = [
  { label: "Admin", username: "admin", password: "admin123", rank: "Accionista ORODIG" },
  { label: "Oro", username: "carlos_mx", password: "demo123", rank: "Oro" },
  { label: "Diamante Azul", username: "maria_garcia", password: "demo123", rank: "Diamante Azul" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [showDemo, setShowDemo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const fillDemo = (username: string, password: string) => {
    form.setValue("username", username);
    form.setValue("password", password);
  };

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
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto p-6 sm:p-8 rounded-2xl bg-black/70 backdrop-blur-xl border shadow-[0_0_60px_rgba(201,145,26,0.3)]"
        style={{ borderColor: "hsl(42 68% 50% / 0.4)" }}>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-baseline gap-1 mb-1">
            <h1 className="text-4xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(201,145,26,0.7)]"
              style={{ color: "hsl(42,68%,52%)" }}>
              ORODIG
            </h1>
            <span className="text-4xl font-black text-white tracking-tighter">PTS</span>
          </div>
          <p className="text-white/60 text-xs tracking-widest uppercase">Oro Digital Para Todos</p>
          <div className="mt-3 h-px w-16 mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(42,68%,50%), transparent)" }} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 text-sm font-semibold">Usuario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingresa tu usuario"
                      autoComplete="username"
                      {...field}
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0 h-11 text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 text-sm font-semibold">Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa tu contraseña"
                        autoComplete="current-password"
                        {...field}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-[hsl(42,68%,50%)] focus-visible:ring-0 h-11 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full font-black tracking-widest uppercase h-12 text-black text-sm"
              style={{
                background: loginMutation.isPending
                  ? "hsl(42,68%,35%)"
                  : "linear-gradient(135deg, hsl(42,68%,40%), hsl(42,68%,58%), hsl(42,68%,44%))",
                boxShadow: "0 0 25px hsl(42 68% 50% / 0.5)",
              }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Verificando..." : "ACCEDER A LA PLATAFORMA"}
            </Button>
          </form>
        </Form>

        {/* Demo credentials */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="w-full flex items-center justify-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors py-1"
          >
            {showDemo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Credenciales de prueba
          </button>

          {showDemo && (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => fillDemo(u.username, u.password)}
                  className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-[hsl(42,68%,40%)] transition-colors text-center"
                >
                  <span className="text-[10px] font-bold" style={{ color: "hsl(42,68%,55%)" }}>{u.label}</span>
                  <span className="text-[9px] text-white/50 mt-0.5">{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">
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
