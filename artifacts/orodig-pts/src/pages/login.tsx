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
import loginBg from "@assets/image_1778968907902.png";

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
        setLocation("/dashboard");
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})`, opacity: 0.85 }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto p-6 sm:p-8 rounded-2xl bg-black/65 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(255,215,0,0.2)]">
        <div className="text-center mb-7">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
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
                      className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-11"
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
                      className="bg-black/50 border-primary/40 text-white placeholder:text-white/40 focus-visible:ring-primary h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              data-testid="button-submit"
              className="w-full bg-primary hover:bg-primary/90 text-black font-black tracking-widest uppercase h-12 shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_35px_rgba(255,215,0,0.6)] transition-all text-sm mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Verificando..." : "ACCEDER A LA PLATAFORMA"}
            </Button>
          </form>
        </Form>

        <div className="mt-5 text-center">
          <p className="text-white/60 text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-bold underline underline-offset-4">
              Únete a la Red
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
