import { apiRequest } from "./client";
import type { AdminUser } from "./auth";

export const usersApi = {
  // TODO: Wire to your real "list all admins" endpoint when available, e.g. GET /users/all.
  list: async (): Promise<AdminUser[]> => {
    try {
      return await apiRequest<AdminUser[]>("/users/all");
    } catch {
      return [];
    }
  },
  create: (payload: { name: string; email: string; password: string; phone?: string; role?: string }) =>
    apiRequest<AdminUser>("/users/register", { method: "POST", body: payload }),
  // Optional future endpoints:
  update: (id: string | number, body: unknown) =>
    apiRequest(`/users/update/${id}`, { method: "PUT", body }),
  remove: (id: string | number) =>
    apiRequest(`/users/delete/${id}`, { method: "DELETE" }),
};
