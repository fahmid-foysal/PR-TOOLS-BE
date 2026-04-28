import { apiRequest } from "./client";

export type ConfigItem = {
  id: string | number;
  name?: string;
  title?: string;
  one_liner?: string;
  description?: string;
  image?: string;
  image_url?: string;
  link?: string;
  position?: number;
  [key: string]: unknown;
};

function crud(prefix: string) {
  return {
    list: () => apiRequest<ConfigItem[]>(`${prefix}/all`),
    create: (body: unknown) => apiRequest(`${prefix}/create`, { method: "POST", body }),
    createMultipart: (formData: FormData) =>
      apiRequest(`${prefix}/create`, { method: "POST", formData }),
    update: (id: string | number, body: unknown) =>
      apiRequest(`${prefix}/update/${id}`, { method: "PUT", body }),
    updateMultipart: (id: string | number, formData: FormData) =>
      apiRequest(`${prefix}/update/${id}`, { method: "PUT", formData }),
    remove: (id: string | number) =>
      apiRequest(`${prefix}/delete/${id}`, { method: "DELETE" }),
  };
}



export const configApi = {
  brands: crud("/config/brand"),
  categories: crud("/config/category"),
  offerCategories: crud("/config/offer-category"),
  homePageSections: crud("/config/home-page-section"),
  banners: crud("/config/banner"),
};
