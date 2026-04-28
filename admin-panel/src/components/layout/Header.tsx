import { useState } from "react";
import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import { Menu, LogOut, User as UserIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  configurations: "Configurations",
  brands: "Brands",
  categories: "Categories",
  "offer-categories": "Offer Categories",
  "home-page-sections": "Home Page Sections",
  banners: "Banners",
  products: "Products",
  new: "Create",
  edit: "Edit",
  "home-page": "Home Page Products",
  orders: "Orders",
  "admin-users": "Admin Users",
  profile: "Profile",
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <nav className="hidden md:flex items-center text-sm text-muted-foreground">
      {parts.map((p, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        const label = LABELS[p] ?? decodeURIComponent(p);
        return (
          <span key={href} className="flex items-center">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1" />}
            {last ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials =
    (user?.name || user?.email || "A")
      .split(/\s+|@/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  const onLogout = async () => {
    setLoggingOut(true);
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <Menu className="h-5 w-5" />
      </Button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full hover:bg-accent transition-colors p-1 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">{user?.name || user?.email || "Admin"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.name || "Administrator"}</div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserIcon className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} disabled={loggingOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
