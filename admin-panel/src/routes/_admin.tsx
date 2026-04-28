import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/common/States";
import { TOKEN_KEY } from "@/lib/constants";

export const Route = createFileRoute("/_admin")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AdminShell,
});

function AdminShell() {
  const { initializing, isAuthenticated } = useAuth();
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState label="Loading admin..." />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState label="Redirecting to login..." />
      </div>
    );
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
