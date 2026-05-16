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
import loginBg from "@assets/image_1778968907902.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token, res.member);
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Login failed",
          description: err.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/80 via-black/60 to-purple-900/40" />
      
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-primary/20 shadow-[0_0_40px_rgba(255,215,0,0.15)]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            ORODIG <span className="text-white">PTS</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Oro Digital Para Todos</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-foreground">Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
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
                  <FormLabel className="text-primary-foreground">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase h-12 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Access Platform"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-bold underline underline-offset-4">
              Join the Network
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
