import axios, { AxiosError, type AxiosRequestConfig } from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://safechain-backend.onrender.com";

const TOKEN_KEY = "sc_access_token";
const REFRESH_KEY = "sc_refresh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
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
  baseURL: `${API_BASE_URL}/api`,
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

// ---- Refresh-token logic with single-flight queue ----
let refreshing: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

async function performRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await axios.post<{ accessToken: string; refreshToken?: string }>(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken: rt },
      { headers: { "Content-Type": "application/json" }, timeout: 15_000 }
    );
    setTokens(res.data.accessToken, res.data.refreshToken ?? rt);
    return res.data.accessToken;
  } catch {
    setTokens(null, null);
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError<{ message?: string; error?: string }>) => {
    const status = err.response?.status;
    const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isRefreshCall = typeof original?.url === "string" && original.url.includes("/auth/refresh");
    if (status === 401 && original && !original._retry && !isRefreshCall && getRefreshToken()) {
      original._retry = true;
      refreshing = refreshing ?? performRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }
    if (status === 401) {
      setTokens(null, null);
      onUnauthorized?.();
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

export const ALL_ROLES: Role[] = ["super_admin", "admin", "responder", "gbv_officer", "counsellor", "developer"];

export type UserStatus = "pending" | "active" | "suspended" | "rejected";
export const REPORT_STATUSES = ["New", "Assigned", "In_Progress", "Escalated", "Resolved", "Closed"] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

export interface AuthUser { id: string; email: string; role: Role; first_name?: string; last_name?: string; status?: UserStatus; }
export interface LoginResponse { accessToken: string; refreshToken?: string; user: AuthUser; }

export interface PendingUser {
  id: string; first_name: string; last_name: string; email: string;
  role: Role; province?: string; district?: string; created_at?: string; phone?: string;
}
export interface ManagedUser extends PendingUser { status: UserStatus; }

export interface ReportListItem {
  id: string; category: string; status: ReportStatus; created_at: string;
  province?: string; district?: string; assigned_to?: string | null;
}
export interface ReportHistoryEntry { id: string; action: string; actor?: string; created_at: string; details?: string; }
export interface ReportNote { id: string; body: string; author?: string; created_at: string; }
export interface ReportAttachment { id: string; filename: string; url: string; uploaded_at?: string; }
export interface ReportDetail extends ReportListItem {
  description?: string; reporter_name?: string; reporter_phone?: string;
  notes?: ReportNote[]; history?: ReportHistoryEntry[]; attachments?: ReportAttachment[];
}
export interface ReportInput {
  category: string; description: string; province: string; district: string;
  reporter_name?: string; reporter_phone?: string;
}

export interface NotificationItem {
  id: string; message: string; read: boolean; created_at?: string; type?: string;
}

export interface SuperAdminStats {
  totalUsers: number; pendingUsers: number; activeUsers?: number;
  totalReports: number; openReports: number; resolvedReports: number;
  totalFacilities: number; unreadNotifications?: number;
}
export interface AdminStats {
  totalReports: number; assignedReports: number; openReports: number; resolvedReports?: number;
}
export interface FacilityItem { id: string; name: string; province?: string; district?: string; type?: string; }

// ============ Endpoint helpers ============
export const auth = {
  login: (body: { email: string; password: string }) =>
    api.post<LoginResponse>("/auth/login", body).then((r) => r.data),
  register: (body: { first_name: string; last_name: string; email: string; password: string; phone: string; role: Role }) =>
    api.post<{ success: boolean; message: string }>("/auth/register", body).then((r) => r.data),
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
  logout: () => api.post<{ success: boolean }>("/auth/logout").then((r) => r.data).catch(() => ({ success: false })),
};

export const users = {
  list: (params?: { role?: Role; status?: UserStatus; q?: string }) =>
    api.get<ManagedUser[]>("/users", { params }).then((r) => r.data),
  pending: () => api.get<PendingUser[]>("/users/pending").then((r) => r.data),
  approve: (id: string) => api.patch<{ success: boolean }>(`/users/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.patch<{ success: boolean }>(`/users/${id}/reject`).then((r) => r.data),
  suspend: (id: string) => api.patch<{ success: boolean }>(`/users/${id}/suspend`).then((r) => r.data),
  reactivate: (id: string) => api.patch<{ success: boolean }>(`/users/${id}/reactivate`).then((r) => r.data),
  setRole: (id: string, role: Role) => api.patch<{ success: boolean }>(`/users/${id}/role`, { role }).then((r) => r.data),
};

export const reports = {
  list: (params?: { status?: ReportStatus; q?: string; assignedTo?: string }) =>
    api.get<ReportListItem[]>("/reports", { params }).then((r) => r.data),
  get: (id: string) => api.get<ReportDetail>(`/reports/${id}`).then((r) => r.data),
  create: (body: ReportInput) => api.post<{ id: string; status: string }>("/reports", body).then((r) => r.data),
  setStatus: (id: string, status: ReportStatus) =>
    api.patch<{ success: boolean }>(`/reports/${id}/status`, { status }).then((r) => r.data),
  assign: (id: string, responder_id: string) =>
    api.post<{ success: boolean }>(`/reports/${id}/assign`, { responder_id }).then((r) => r.data),
  addNote: (id: string, body: string) =>
    api.post<{ success: boolean; note: ReportNote }>(`/reports/${id}/notes`, { body }).then((r) => r.data),
  upload: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<{ success: boolean; attachment: ReportAttachment }>(`/reports/${id}/attachments`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};

export const notifications = {
  list: () => api.get<NotificationItem[]>("/notifications").then((r) => r.data),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch<{ success: boolean }>(`/notifications/read-all`).then((r) => r.data),
};

export const dashboard = {
  superAdmin: () => api.get<SuperAdminStats>("/dashboard/super-admin").then((r) => r.data),
  admin: () => api.get<AdminStats>("/dashboard/admin").then((r) => r.data),
};

export const facilities = {
  list: () => api.get<FacilityItem[]>("/facilities").then((r) => r.data),
};
