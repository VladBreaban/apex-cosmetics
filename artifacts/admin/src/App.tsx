import { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useGetMe } from "@workspace/api-client-react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
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

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(228 73% 44%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 72% 50%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "var(--app-font-sans, 'Inter', sans-serif)",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-card border border-border shadow-[0_20px_60px_rgba(15,23,42,0.10)] rounded-xl w-[420px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "!text-2xl !font-semibold !text-foreground",
    headerSubtitle: "!text-muted-foreground",
    socialButtonsBlockButton: "!border-border hover:!bg-secondary !transition-colors",
    socialButtonsBlockButtonText: "!text-foreground !font-medium",
    dividerLine: "!bg-border",
    dividerText: "!text-muted-foreground !uppercase !tracking-[0.15em] !text-[10px]",
    formFieldLabel: "!text-foreground !text-xs !font-semibold",
    formFieldInput: "!bg-card !border-border !text-foreground focus:!border-primary",
    formButtonPrimary:
      "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-semibold",
    footerActionText: "!text-muted-foreground",
    footerActionLink: "!text-primary hover:!text-primary/80",
    identityPreviewEditButton: "!text-primary",
    formFieldSuccessText: "!text-emerald-600",
    formFieldErrorText: "!text-destructive",
    alertText: "!text-foreground",
    logoImage: "!h-8 !w-auto",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4 py-16">
      <SignIn routing="path" path={`${basePath}/sign-in`} withSignUp={false} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

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

function CenteredMessage({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6 text-muted-foreground">{icon}</div>
        <h1 className="text-2xl font-semibold text-foreground mb-3">{title}</h1>
        <div className="text-muted-foreground text-sm">{children}</div>
      </div>
    </div>
  );
}

// Gates the whole admin UI behind an authenticated user with the admin role.
function AdminGate() {
  const { data: me, isLoading, isError } = useGetMe();
  const { signOut } = useClerk();

  if (isLoading) {
    return (
      <CenteredMessage
        icon={<Loader2 className="w-8 h-8 animate-spin" />}
        title="Checking access…"
      />
    );
  }

  if (isError || me?.role !== "admin") {
    return (
      <CenteredMessage
        icon={<ShieldAlert className="w-10 h-10 text-destructive" />}
        title="Access denied"
      >
        <p className="mb-6">
          Your account doesn't have permission to access the admin panel.
        </p>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: `${basePath}/sign-in` })}
          className="inline-flex items-center px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign out
        </button>
      </CenteredMessage>
    );
  }

  return <AdminRoutes />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      localization={{
        signIn: {
          start: {
            title: "Apex Health Admin",
            subtitle: "Sign in to manage the store",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route>
              <Show when="signed-in">
                <AdminGate />
              </Show>
              <Show when="signed-out">
                <Redirect to="/sign-in" />
              </Show>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
