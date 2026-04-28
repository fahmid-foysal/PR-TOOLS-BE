import { apiRequest } from "./client";

export type AdminUser = {
  id: string | number;
  name?: string;
  email: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
};

export type LoginResponse = {
  token: string;
  user?: AdminUser;
  [key: string]: unknown;
};

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>("/users/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  profile: () => apiRequest<AdminUser>("/users/profile"),
  register: (payload: { name: string; email: string; password: string; phone?: string; role?: string }) =>
    apiRequest<AdminUser>("/users/register", { method: "POST", body: payload }),
};
