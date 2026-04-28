import { TOKEN_KEY } from "../constants";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, data: unknown, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.data = data;
    this.fieldErrors = fieldErrors;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

function normalizeError(status: number, data: any): ApiError {
  let message = `Request failed (${status})`;
  let fieldErrors: Record<string, string> | undefined;

  if (data && typeof data === "object") {
    if (typeof data.message === "string") message = data.message;
    else if (typeof data.error === "string") message = data.error;
    else if (typeof data.detail === "string") message = data.detail;

    if (data.errors && typeof data.errors === "object") {
      fieldErrors = {};
      for (const [k, v] of Object.entries(data.errors)) {
        fieldErrors[k] = Array.isArray(v) ? String(v[0]) : String(v);
      }
    }
  } else if (typeof data === "string" && data) {
    message = data;
  }

  if (status === 401) message = message || "Unauthorized";
  return new ApiError(message, status, data, fieldErrors);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  query?: Record<string, unknown>;
  signal?: AbortSignal;
  auth?: boolean; // default true
};

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query, signal, auth = true } = opts;

  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}${buildQuery(query)}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, signal });
  } catch (e: any) {
    throw new ApiError(e?.message || "Network error", 0, null);
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = normalizeError(res.status, data);
    if (res.status === 401 && typeof window !== "undefined") {
      // Token invalid/expired — clear and bounce to login
      window.localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw err;
  }

  // Many backends wrap data as { data: ..., success: true }. Normalize when obvious.
  if (data && typeof data === "object" && "data" in data && Object.keys(data).length <= 4) {
    return (data.data ?? data) as T;
  }
  return data as T;
}
