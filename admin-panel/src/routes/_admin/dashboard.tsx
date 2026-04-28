import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Settings, Package, ShoppingCart, Users, Tag, FolderTree, Sparkles, LayoutGrid, Image as ImageIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_admin/dashboard")({
  component: Dashboard,
});

const SUMMARY = [
  { label: "Configurations", value: "5 modules", icon: Settings, href: "/configurations/brands", color: "bg-blue-500/10 text-blue-600" },
  { label: "Products", value: "Manage catalog", icon: Package, href: "/products", color: "bg-emerald-500/10 text-emerald-600" },
  { label: "Orders", value: "Track & fulfil", icon: ShoppingCart, href: "/orders", color: "bg-amber-500/10 text-amber-600" },
  { label: "Admin Users", value: "Team access", icon: Users, href: "/admin-users", color: "bg-violet-500/10 text-violet-600" },
];

const QUICK = [
  { label: "Brands", href: "/configurations/brands", icon: Tag },
  { label: "Categories", href: "/configurations/categories", icon: FolderTree },
  { label: "Offer Categories", href: "/configurations/offer-categories", icon: Sparkles },
  { label: "Home Page Sections", href: "/configurations/home-page-sections", icon: LayoutGrid },
  { label: "Banners", href: "/configurations/banners", icon: ImageIcon },
  { label: "All Products", href: "/products", icon: Package },
];

function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ""} 👋`}
        description="Overview of your PR TOOLS admin workspace."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY.map((s) => (
          <Link key={s.label} to={s.href as any} className="block group">
            <Card className="hover:shadow-md hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center ${s.color} mb-3`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="font-semibold text-foreground mt-0.5 flex items-center justify-between">
                  {s.value}
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK.map((q) => (
                <Link
                  key={q.href}
                  to={q.href as any}
                  className="flex items-center gap-3 rounded-md border border-border p-3 hover:border-primary hover:bg-accent/40 transition-colors"
                >
                  <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center text-accent-foreground">
                    <q.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{q.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>· Use the sidebar to access every module.</p>
            <p>· Statistics will appear here once a summary endpoint is wired up.</p>
            <p>· Manage your team under <Link to="/admin-users" className="text-primary hover:underline">Admin Users</Link>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
