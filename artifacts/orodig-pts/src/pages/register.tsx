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
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
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
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      referralCode: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token, res.member);
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.message || "An error occurred during registration",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative py-12">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-black/80 via-black/60 to-cyan-900/40" />
      
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-primary/20 shadow-[0_0_40px_rgba(34,211,238,0.15)] overflow-y-auto max-h-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            ORODIG <span className="text-white">PTS</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Join the Exclusive Network</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-foreground">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-foreground">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-foreground">Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Choose a username" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
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
                    <Input type="password" placeholder="Create a secure password" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-foreground">Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8900" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-foreground">Sponsor Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Who invited you?" {...field} className="bg-black/50 border-primary/30 text-white focus-visible:ring-primary uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-widest uppercase h-12 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all mt-6"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Already a member?{" "}
            <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
