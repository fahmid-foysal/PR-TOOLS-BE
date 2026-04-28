import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import { APP_NAME } from "@/lib/constants";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(4, "Password is required"),
});

type LoginSearch = { redirect?: string };
export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && typeof window !== "undefined") {
    navigate({ to: "/dashboard" });
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Welcome back!");
      const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/dashboard";
      window.location.href = target;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-accent/40">
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary-foreground/15 flex items-center justify-center font-bold">
              PR
            </div>
            <span className="font-semibold">{APP_NAME}</span>
          </div>
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Run your mobile parts business with confidence.
          </h2>
          <p className="text-primary-foreground/80">
            Manage products, offers, banners, orders, and your team — all from one polished
            admin dashboard.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} PR TOOLS</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground">
              PR
            </div>
            <span className="font-semibold">{APP_NAME}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Admin access only.</p>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="admin@example.com"
                  disabled={submitting}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  disabled={submitting}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
