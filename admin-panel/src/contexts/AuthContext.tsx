import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, type AdminUser } from "../lib/api/auth";
import { TOKEN_KEY, USER_KEY } from "../lib/constants";

type AuthContextValue = {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setInitializing(false);
      return;
    }
    const t = window.localStorage.getItem(TOKEN_KEY);
    const u = window.localStorage.getItem(USER_KEY);
    if (t) setToken(t);
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        /* ignore */
      }
    }
    setInitializing(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.profile();
      setUser(profile);
      window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const t = (res as any)?.token || (res as any)?.access_token || (res as any)?.data?.token;
    if (!t) throw new Error("Login response did not include a token");
    window.localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    const u = (res as any)?.user || (res as any)?.data?.user || null;
    if (u) {
      setUser(u);
      window.localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      // Fetch profile if not returned with login
      try {
        const profile = await authApi.profile();
        setUser(profile);
        window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      initializing,
      login,
      logout,
      refreshProfile,
    }),
    [user, token, initializing, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
