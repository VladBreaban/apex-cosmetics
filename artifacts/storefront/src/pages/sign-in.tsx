import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup";

/**
 * Combined sign-in / sign-up screen for storefront customers.
 *
 * Rendered for both /sign-in and /sign-up; `initialMode` selects which half is
 * shown first, and the toggle at the bottom swaps between them without a
 * navigation so a mistyped choice does not lose what was already entered.
 */
export default function SignInPage({
  initialMode = "login",
}: {
  initialMode?: Mode;
}) {
  const { login, signup } = useAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email.trim(), password, name.trim() || undefined);
      } else {
        await login(email.trim(), password);
      }
      setLocation("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setError(null);
    setPassword("");
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-24">
      <div className="w-[440px] max-w-full rounded-2xl border border-border bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-foreground">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Join Apex Health to track your orders"
              : "Sign in to your Apex Health account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              >
                Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={isSignup ? 8 : undefined}
            />
            {isSignup && (
              <p className="text-xs text-muted-foreground">
                At least 8 characters.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full text-[11px] font-semibold uppercase tracking-[0.2em]"
            disabled={submitting}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "New to Apex Health?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}
