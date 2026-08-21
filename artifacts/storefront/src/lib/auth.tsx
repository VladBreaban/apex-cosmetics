import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "./api-base";

export interface CustomerUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: CustomerUser | null;
  /** True until the initial session probe resolves. */
  loading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function authRequest(
  action: "login" | "signup",
  body: Record<string, string | undefined>,
): Promise<CustomerUser> {
  const res = await fetch(apiUrl(`/api/auth/${action}`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data && typeof data.error === "string" && data.error) ||
        "Something went wrong. Please try again.",
    );
  }
  return data as CustomerUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Order history and saved addresses are per-user, so any identity change has
  // to drop cached query data or the next user sees the previous one's.
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const id = user?.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== id) {
      queryClient.clear();
    }
    prevUserIdRef.current = id;
  }, [user, queryClient]);

  useEffect(() => {
    let active = true;
    fetch(apiUrl("/api/auth/session"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setUser((d as CustomerUser | null) ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authRequest("login", { email, password }));
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      setUser(await authRequest("signup", { email, password, name }));
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isSignedIn: !!user, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
