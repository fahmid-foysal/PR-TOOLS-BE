import { apiRequest } from "./client";

export type ProductImage = { id: string | number; image?: string; image_url?: string; url?: string };
export type ProductOffer = {
  id: string | number;
  offer_category_id?: string | number;
  offer_category?: { id: string | number; name: string } | string;
  offered_price?: number;
  offer_amount?: number;
  offer_expires_at?: string;
};
export type Product = {
  id: string | number;
  product_name: string;
  purchase_price?: number;
  sell_price?: number;
  brand_id?: string | number;
  category_id?: string | number;
  brand?: { id: string | number; name: string };
  category?: { id: string | number; name: string };
  one_liner?: string;
  description?: string;
  images?: ProductImage[];
  offers?: ProductOffer[];
  offer_category?: string | { name: string } | null;
  offered_price?: number | null;
  offer_expires_at?: string | null;
  [key: string]: unknown;
};

export type ProductListQuery = {
  page?: number;
  limit?: number;
  category_id?: string | number;
  brand_id?: string | number;
  offer_category_id?: string | number;
  search_query?: string;
};

export type Paginated<T> = {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
};

export const productsApi = {
  list: (query: ProductListQuery) =>
    apiRequest<Paginated<Product> | Product[]>("/products/product/all", { query }),
  details: (id: string | number) => apiRequest<Product>(`/products/product/details/${id}`),
  create: (formData: FormData) =>
    apiRequest<Product>("/products/product/create", { method: "POST", formData }),
  update: (id: string | number, body: unknown) =>
    apiRequest<Product>(`/products/product/update/${id}`, { method: "PUT", body }),
  remove: (id: string | number) =>
    apiRequest(`/products/product/delete/${id}`, { method: "DELETE" }),

  images: {
    add: (formData: FormData) =>
      apiRequest("/products/product-image/create", { method: "POST", formData }),
    remove: (id: string | number) =>
      apiRequest(`/products/product-image/delete/${id}`, { method: "DELETE" }),
  },
  offers: {
    add: (body: unknown) =>
      apiRequest("/products/product-offer/create", { method: "POST", body }),
    remove: (id: string | number) =>
      apiRequest(`/products/product-offer/delete/${id}`, { method: "DELETE" }),
  },
  homePageProducts: {
    list: () => apiRequest<any[]>("/products/home-page-product/all"),
    add: (body: { product_id: string | number; home_page_section_id: string | number }) =>
      apiRequest("/products/home-page-product/create", { method: "POST", body }),
    remove: (id: string | number) =>
      apiRequest(`/products/home-page-product/delete/${id}`, { method: "DELETE" }),
  },
};
