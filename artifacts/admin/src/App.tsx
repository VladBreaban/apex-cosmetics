import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";

import { Layout } from "@/components/layout";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import ProductPrices from "@/pages/product-prices";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Discounts from "@/pages/discounts";
import Users from "@/pages/users";
import UserDetail from "@/pages/user-detail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AdminRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id/prices" component={ProductPrices} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/discounts" component={Discounts} />
        <Route path="/users" component={Users} />
        <Route path="/users/:id" component={UserDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Clears React Query cache whenever the signed-in admin changes (login/logout)
// so one admin never sees another's cached data.
function CacheReset() {
  const { admin } = useAuth();
  const qc = useQueryClient();
  const prevId = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    const id = admin?.id ?? null;
    if (prevId.current !== undefined && prevId.current !== id) {
      qc.clear();
    }
    prevId.current = id;
  }, [admin, qc]);

  return null;
}

// Gates the whole admin UI behind an authenticated session.
function AuthGate() {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin) {
    return <LoginPage />;
  }

  return <AdminRoutes />;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CacheReset />
          <TooltipProvider>
            <AuthGate />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
