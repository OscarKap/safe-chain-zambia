// SafeChain API layer — Lovable Cloud (Supabase) backed.
// Keeps the previous surface (auth/users/reports/notifications/dashboard/facilities)
// so existing routes continue to work without changes.

import { supabase } from "@/integrations/supabase/client";
import facilitiesData from "@/data/facilities.json";

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

export const ALL_ROLES: Role[] = [
  "super_admin", "admin", "responder", "gbv_officer", "counsellor", "developer",
];

export type UserStatus = "pending" | "active" | "suspended" | "rejected";
export const REPORT_STATUSES = ["New", "Assigned", "In_Progress", "Escalated", "Resolved", "Closed"] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

export interface AuthUser {
  id: string; email: string; role: Role;
  first_name?: string; last_name?: string; status?: UserStatus;
}
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

// ============ Helpers ============
export function apiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return err instanceof Error ? err.message : "Request failed";
}

// Legacy no-op token helpers (kept for backward-compat with imports)
export function getToken(): string | null { return null; }
export function setTokens(_a: string | null, _b?: string | null): void { /* no-op */ }
export function setOnUnauthorized(_cb: (() => void) | null): void { /* no-op */ }

async function loadRole(userId: string): Promise<Role> {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as Role);
  const priority: Role[] = ["super_admin", "admin", "developer", "gbv_officer", "responder", "counsellor"];
  for (const r of priority) if (roles.includes(r)) return r;
  return roles[0] ?? "responder";
}

async function loadCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,status,email")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = await loadRole(user.id);
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    role,
    first_name: profile?.first_name ?? undefined,
    last_name: profile?.last_name ?? undefined,
    status: (profile?.status as UserStatus | undefined) ?? "pending",
  };
}

// ============ auth ============
export const auth = {
  async login({ email, password }: { email: string; password: string }): Promise<LoginResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(error?.message || "Invalid credentials");
    const me = await loadCurrentUser();
    if (!me) throw new Error("Could not load account");
    if (me.status === "pending") { await supabase.auth.signOut(); throw new Error("Your account is awaiting approval"); }
    if (me.status === "suspended") { await supabase.auth.signOut(); throw new Error("Your account has been suspended"); }
    if (me.status === "rejected") { await supabase.auth.signOut(); throw new Error("Your account request was rejected"); }
    return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, user: me };
  },

  async register(body: {
    first_name: string; last_name: string; email: string;
    password: string; phone: string; role: Role;
  }): Promise<{ success: boolean; message: string }> {
    const emailRedirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo,
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
          role: body.role,
        },
      },
    });
    if (error) throw new Error(error.message);
    // If session auto-created (email confirmation off), immediately sign out so
    // the user cannot access anything until approved.
    if (data.session) await supabase.auth.signOut();
    return { success: true, message: "Request submitted for approval" };
  },

  async me(): Promise<AuthUser> {
    const me = await loadCurrentUser();
    if (!me) throw new Error("Not signed in");
    return me;
  },

  async logout(): Promise<{ success: boolean }> {
    await supabase.auth.signOut();
    return { success: true };
  },
};

// ============ users ============
async function fetchUsers(filters?: { status?: UserStatus; role?: Role; q?: string }): Promise<ManagedUser[]> {
  let q = supabase.from("profiles").select("user_id,first_name,last_name,email,phone,province,district,status,pending_role,created_at");
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.q) {
    const t = `%${filters.q}%`;
    q = q.or(`email.ilike.${t},first_name.ilike.${t},last_name.ilike.${t}`);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  // Batch-load roles
  const ids = rows.map((r) => r.user_id);
  const roleMap = new Map<string, Role>();
  if (ids.length) {
    const { data: rs } = await supabase.from("user_roles").select("user_id,role").in("user_id", ids);
    (rs ?? []).forEach((r) => {
      const prev = roleMap.get(r.user_id);
      // Priority: super_admin > admin > ...
      const priority: Role[] = ["super_admin", "admin", "developer", "gbv_officer", "responder", "counsellor"];
      const nextR = r.role as Role;
      if (!prev || priority.indexOf(nextR) < priority.indexOf(prev)) roleMap.set(r.user_id, nextR);
    });
  }

  let out: ManagedUser[] = rows.map((r) => ({
    id: r.user_id,
    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",
    email: r.email,
    phone: r.phone ?? undefined,
    province: r.province ?? undefined,
    district: r.district ?? undefined,
    created_at: r.created_at ?? undefined,
    status: r.status as UserStatus,
    role: (roleMap.get(r.user_id) ?? (r.pending_role as Role | null) ?? "responder") as Role,
  }));
  if (filters?.role) out = out.filter((u) => u.role === filters.role);
  return out;
}

export const users = {
  list: (params?: { role?: Role; status?: UserStatus; q?: string }) => fetchUsers(params),
  pending: () => fetchUsers({ status: "pending" }) as Promise<PendingUser[]>,

  async approve(id: string): Promise<{ success: boolean }> {
    // Read pending_role → grant it, then activate.
    const { data: prof, error: pe } = await supabase
      .from("profiles").select("pending_role").eq("user_id", id).maybeSingle();
    if (pe) throw new Error(pe.message);
    const role = (prof?.pending_role as Role | null) ?? "responder";
    const { error: re } = await supabase.from("user_roles")
      .upsert({ user_id: id, role }, { onConflict: "user_id,role" });
    if (re) throw new Error(re.message);
    const { error: ue } = await supabase.from("profiles")
      .update({ status: "active" }).eq("user_id", id);
    if (ue) throw new Error(ue.message);
    return { success: true };
  },

  async reject(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from("profiles").update({ status: "rejected" }).eq("user_id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async suspend(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from("profiles").update({ status: "suspended" }).eq("user_id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async reactivate(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from("profiles").update({ status: "active" }).eq("user_id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async setRole(id: string, role: Role): Promise<{ success: boolean }> {
    // Wipe existing role rows and insert new (simple single-role model at app layer)
    const { error: de } = await supabase.from("user_roles").delete().eq("user_id", id);
    if (de) throw new Error(de.message);
    const { error: ie } = await supabase.from("user_roles").insert({ user_id: id, role });
    if (ie) throw new Error(ie.message);
    return { success: true };
  },
};

// ============ reports ============
export const reports = {
  async list(params?: { status?: ReportStatus; q?: string; assignedTo?: string }): Promise<ReportListItem[]> {
    let q = supabase.from("reports").select("id,category,status,created_at,province,district,assigned_to");
    if (params?.status) q = q.eq("status", params.status);
    if (params?.assignedTo) q = q.eq("assigned_to", params.assignedTo);
    if (params?.q) q = q.ilike("description", `%${params.q}%`);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ReportListItem[];
  },

  async get(id: string): Promise<ReportDetail> {
    const { data: r, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Report not found");
    const [{ data: notes }, { data: history }] = await Promise.all([
      supabase.from("report_notes").select("id,body,author_id,created_at").eq("report_id", id).order("created_at"),
      supabase.from("report_history").select("id,action,details,actor_id,created_at").eq("report_id", id).order("created_at"),
    ]);
    return {
      id: r.id,
      category: r.category,
      status: r.status as ReportStatus,
      created_at: r.created_at,
      province: r.province ?? undefined,
      district: r.district ?? undefined,
      assigned_to: r.assigned_to ?? null,
      description: r.description ?? undefined,
      reporter_name: r.reporter_name ?? undefined,
      reporter_phone: r.reporter_phone ?? undefined,
      notes: (notes ?? []).map((n) => ({ id: n.id, body: n.body, author: n.author_id ?? undefined, created_at: n.created_at })),
      history: (history ?? []).map((h) => ({ id: h.id, action: h.action, details: h.details ?? undefined, actor: h.actor_id ?? undefined, created_at: h.created_at })),
      attachments: [],
    };
  },

  async create(body: ReportInput): Promise<{ id: string; status: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("reports").insert({
      category: body.category,
      description: body.description,
      province: body.province,
      district: body.district,
      reporter_name: body.reporter_name ?? null,
      reporter_phone: body.reporter_phone ?? null,
      submitted_by: user?.id ?? null,
    }).select("id,status").single();
    if (error) throw new Error(error.message);
    return { id: data.id, status: data.status };
  },

  async setStatus(id: string, status: ReportStatus): Promise<{ success: boolean }> {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("report_history").insert({ report_id: id, action: `status:${status}`, actor_id: user?.id ?? null });
    return { success: true };
  },

  async assign(id: string, responder_id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from("reports").update({ assigned_to: responder_id, status: "Assigned" }).eq("id", id);
    if (error) throw new Error(error.message);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("report_history").insert({ report_id: id, action: "assigned", details: responder_id, actor_id: user?.id ?? null });
    await supabase.from("notifications").insert({ user_id: responder_id, message: `New case assigned to you (${id.slice(0, 8)})`, type: "assignment" });
    return { success: true };
  },

  async addNote(id: string, body: string): Promise<{ success: boolean; note: ReportNote }> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("report_notes")
      .insert({ report_id: id, body, author_id: user?.id ?? null })
      .select("id,body,author_id,created_at").single();
    if (error) throw new Error(error.message);
    return { success: true, note: { id: data.id, body: data.body, author: data.author_id ?? undefined, created_at: data.created_at } };
  },

  async upload(_id: string, _file: File): Promise<{ success: boolean; attachment: ReportAttachment }> {
    throw new Error("File uploads not yet enabled");
  },
};

// ============ notifications ============
export const notifications = {
  async list(): Promise<NotificationItem[]> {
    const { data, error } = await supabase.from("notifications")
      .select("id,message,read,created_at,type").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as NotificationItem[];
  },
  async markRead(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
  async markAllRead(): Promise<{ success: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ============ dashboard ============
async function countTable(table: "profiles" | "reports", statusFilter?: string | string[]): Promise<number> {
  let q = table === "profiles"
    ? supabase.from("profiles").select("*", { count: "exact", head: true })
    : supabase.from("reports").select("*", { count: "exact", head: true });
  if (typeof statusFilter === "string") q = q.eq("status", statusFilter);
  else if (Array.isArray(statusFilter)) q = q.in("status", statusFilter);
  const { count } = await q;
  return count ?? 0;
}

export const dashboard = {
  async superAdmin(): Promise<SuperAdminStats> {
    const [totalUsers, pendingUsers, activeUsers, totalReports, resolvedReports] = await Promise.all([
      countTable("profiles"),
      countTable("profiles", "pending"),
      countTable("profiles", "active"),
      countTable("reports"),
      countTable("reports", ["Resolved", "Closed"]),
    ]);
    return {
      totalUsers, pendingUsers, activeUsers, totalReports,
      openReports: Math.max(0, totalReports - resolvedReports),
      resolvedReports,
      totalFacilities: (facilitiesData as unknown[]).length,
    };
  },
  async admin(): Promise<AdminStats> {
    const [totalReports, assignedReports, resolvedReports] = await Promise.all([
      countTable("reports"),
      countTable("reports", "Assigned"),
      countTable("reports", ["Resolved", "Closed"]),
    ]);
    return {
      totalReports, assignedReports,
      openReports: Math.max(0, totalReports - resolvedReports),
      resolvedReports,
    };
  },
};

// ============ facilities ============
export const facilities = {
  async list(): Promise<FacilityItem[]> {
    return (facilitiesData as Array<{ code?: string; name: string; province?: string; district?: string; type?: string }>).map((f, i) => ({
      id: f.code ?? String(i),
      name: f.name,
      province: f.province,
      district: f.district,
      type: f.type,
    }));
  },
};
export const API_BASE_URL = "lovable-cloud";
