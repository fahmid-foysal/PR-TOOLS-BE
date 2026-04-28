import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Settings,
  Tag,
  FolderTree,
  Sparkles,
  LayoutGrid,
  Image as ImageIcon,
  Package,
  PlusCircle,
  Home,
  ShoppingCart,
  Users,
  ChevronDown,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

type NavItem = {
  label: string;
  to?: string;
  icon: ReactNode;
  children?: { label: string; to: string; icon?: ReactNode }[];
  defaultOpen?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  {
    label: "Configurations",
    icon: <Settings className="h-4 w-4" />,
    defaultOpen: true,
    children: [
      { label: "Brands", to: "/configurations/brands", icon: <Tag className="h-4 w-4" /> },
      { label: "Categories", to: "/configurations/categories", icon: <FolderTree className="h-4 w-4" /> },
      { label: "Offer Categories", to: "/configurations/offer-categories", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Home Page Sections", to: "/configurations/home-page-sections", icon: <LayoutGrid className="h-4 w-4" /> },
      { label: "Banners", to: "/configurations/banners", icon: <ImageIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "Products",
    icon: <Package className="h-4 w-4" />,
    defaultOpen: true,
    children: [
      { label: "All Products", to: "/products", icon: <Package className="h-4 w-4" /> },
      { label: "Create Product", to: "/products/new", icon: <PlusCircle className="h-4 w-4" /> },
      { label: "Home Page Products", to: "/products/home-page", icon: <Home className="h-4 w-4" /> },
    ],
  },
  { label: "Orders", to: "/orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Admin Users", to: "/admin-users", icon: <Users className="h-4 w-4" /> },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PR</span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">{APP_NAME}</div>
            <div className="text-xs text-sidebar-foreground/60">Mobile Parts</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} onNavigate={onClose} />
            ) : (
              <NavLeaf key={item.label} to={item.to!} icon={item.icon} label={item.label} onNavigate={onClose} />
            ),
          )}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
          v1.0 · PR TOOLS
        </div>
      </aside>
    </>
  );
}

function NavLeaf({
  to,
  icon,
  label,
  onNavigate,
  nested,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        nested && "pl-9",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function NavGroup({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const containsActive = item.children?.some((c) => pathname.startsWith(c.to));
  const [open, setOpen] = useState(item.defaultOpen ?? containsActive ?? false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
          "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        <span className="flex items-center gap-3">
          {item.icon}
          <span>{item.label}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {item.children!.map((c) => (
            <NavLeaf key={c.to} to={c.to} icon={c.icon ?? null} label={c.label} onNavigate={onNavigate} nested />
          ))}
        </div>
      )}
    </div>
  );
}
