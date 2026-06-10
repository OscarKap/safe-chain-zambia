import axios, { AxiosError } from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://safechain-backend.onrender.com";

const TOKEN_KEY = "sc_access_token";
const REFRESH_KEY = "sc_refresh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setTokens(access: string | null, refresh?: string | null) {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(TOKEN_KEY, access);
  else localStorage.removeItem(TOKEN_KEY);
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ message?: string; error?: string }>) => {
    const status = err.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      // token invalid/expired — clear and let UI react
      setTokens(null, null);
    }
    return Promise.reject(err);
  }
);

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || err.message || "Request failed";
  }
  return err instanceof Error ? err.message : "Request failed";
}

// ============ Types ============
export type Role =
  | "super_admin"
  | "admin"
  | "responder"
  | "gbv_officer"
  | "counsellor"
  | "developer";

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  responder: "Responder",
  gbv_officer: "GBV Officer",
  counsellor: "Counsellor",
  developer: "Developer",
};

export const ROLE_DASHBOARD: Record<Role, string> = {
  super_admin: "/admin/dashboard",
  admin: "/admin/dashboard",
  responder: "/responder/dashboard",
  gbv_officer: "/gbv/dashboard",
  counsellor: "/counsellor/dashboard",
  developer: "/developer/dashboard",
};

export interface AuthUser { id: string; email: string; role: Role; first_name?: string; last_name?: string; }
export interface LoginResponse { accessToken: string; refreshToken?: string; user: AuthUser; }

export interface PendingUser { id: string; first_name: string; last_name: string; email: string; role: Role; }

export interface ReportListItem {
  id: string;
  category: string;
  status: string;
  created_at: string;
  province?: string;
  district?: string;
}
export interface ReportDetail extends ReportListItem {
  description?: string;
  reporter_name?: string;
  reporter_phone?: string;
}
export interface ReportInput {
  category: string;
  description: string;
  province: string;
  district: string;
  reporter_name?: string;
  reporter_phone?: string;
}

export interface NotificationItem { id: string; message: string; read: boolean; created_at?: string; }

export interface SuperAdminStats {
  totalUsers: number; pendingUsers: number; totalReports: number;
  openReports: number; resolvedReports: number; totalFacilities: number;
}
export interface AdminStats { totalReports: number; assignedReports: number; openReports: number; }

// ============ Endpoint helpers ============
export const auth = {
  login: (body: { email: string; password: string }) =>
    api.post<LoginResponse>("/auth/login", body).then((r) => r.data),
  register: (body: { first_name: string; last_name: string; email: string; password: string; phone: string; role: Role }) =>
    api.post<{ success: boolean; message: string }>("/auth/register", body).then((r) => r.data),
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
};

export const users = {
  pending: () => api.get<PendingUser[]>("/users/pending").then((r) => r.data),
  approve: (id: string) => api.patch<{ success: boolean }>(`/users/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.patch<{ success: boolean }>(`/users/${id}/reject`).then((r) => r.data),
};

export const reports = {
  list: () => api.get<ReportListItem[]>("/reports").then((r) => r.data),
  get: (id: string) => api.get<ReportDetail>(`/reports/${id}`).then((r) => r.data),
  create: (body: ReportInput) => api.post<{ id: string; status: string }>("/reports", body).then((r) => r.data),
  setStatus: (id: string, status: string) =>
    api.patch<{ success: boolean }>(`/reports/${id}/status`, { status }).then((r) => r.data),
  assign: (id: string, responder_id: string) =>
    api.post<{ success: boolean }>(`/reports/${id}/assign`, { responder_id }).then((r) => r.data),
};

export const notifications = {
  list: () => api.get<NotificationItem[]>("/notifications").then((r) => r.data),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`).then((r) => r.data),
};

export const dashboard = {
  superAdmin: () => api.get<SuperAdminStats>("/dashboard/super-admin").then((r) => r.data),
  admin: () => api.get<AdminStats>("/dashboard/admin").then((r) => r.data),
};
