import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout, ProtectedRoute } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Network from "@/pages/network";
import Earnings from "@/pages/earnings";
import Leaderboard from "@/pages/leaderboard";
import Products from "@/pages/products";
import Withdrawals from "@/pages/withdrawals";
import Profile from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/network" component={Network} />
          <Route path="/earnings" component={Earnings} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/products" component={Products} />
          <Route path="/withdrawals" component={Withdrawals} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/:rest*" component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
