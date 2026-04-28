import { apiRequest } from "./client";

export type OrderItem = {
  id: string | number;
  product_id?: string | number;
  product_name?: string;
  product?: { product_name?: string; name?: string };
  quantity?: number;
  rate?: number;
  price?: number;
  total?: number;
  image?: string;
};
export type Order = {
  id: string | number;
  order_number?: string;
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  payment_method?: string;
  payment_status?: string;
  total_amount?: number;
  admin_notes?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type OrderListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  search_query?: string;
  from_date?: string;
  to_date?: string;
};

export const ordersApi = {
  list: (query: OrderListQuery) => apiRequest<any>("/order/admin/all", { query }),
  updateStatus: (id: string | number, body: { status: string; admin_notes?: string }) =>
    apiRequest(`/order/admin/status-update/${id}`, { method: "PUT", body }),
  create: (body: unknown) => apiRequest("/order/create", { method: "POST", body }),
};
