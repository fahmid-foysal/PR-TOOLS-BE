export const APP_NAME = "PR TOOLS Admin";

export const TOKEN_KEY = "prtools_admin_token";
export const USER_KEY = "prtools_admin_user";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-violet-100 text-violet-800 border-violet-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  returned: "bg-slate-100 text-slate-800 border-slate-200",
};

export const PAGE_SIZE = 10;
