// SafeChain API layer — Lovable Cloud (Supabase) backed.
// Keeps the previous surface (auth/users/reports/notifications/dashboard/facilities)
// so existing routes continue to work without changes.

import { supabase } from "@/integrations/supabase/client";
import facilitiesData from "@/data/facilities.json";
import {
  adminApproveUserFn, adminRejectUserFn, adminSuspendUserFn,
  adminReactivateUserFn, adminSetRoleFn, adminDeleteUserFn,
  responderWorkloadFn, autoAssignReportFn, assignReportFn,
} from "@/lib/admin.functions";

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
export const REPORT_STATUSES = [
  "New", "Awaiting_Review", "Assigned", "Accepted", "En_Route", "On_Scene",
  "In_Progress", "Escalated", "Resolved", "Closed",
] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];
export const REPORT_WORKFLOW: ReportStatus[] = [
  "New", "Awaiting_Review", "Assigned", "Accepted", "En_Route", "On_Scene", "In_Progress", "Resolved", "Closed",
];
export const REPORT_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type ReportPriority = typeof REPORT_PRIORITIES[number];

export interface AuthUser {
  id: string; email: string; role: Role;
  first_name?: string; last_name?: string; status?: UserStatus;
}
export interface LoginResponse { accessToken: string; refreshToken?: string; user: AuthUser; }

export interface PendingUser {
  id: string; first_name: string; last_name: string; email: string;
  role: Role; province?: string; district?: string; created_at?: string; phone?: string;
  specialization?: string;
}
export interface ManagedUser extends PendingUser { status: UserStatus; }

export interface ResponderWorkload {
  user_id: string; first_name?: string; last_name?: string; email: string;
  province?: string; district?: string; specialization?: string;
  department?: string; case_types?: string[];
  is_available: boolean; max_active_cases: number; open_cases: number;
  phone?: string;
}

export interface ReportListItem {
  id: string; category: string; status: ReportStatus; created_at: string;
  province?: string; district?: string; assigned_to?: string | null;
  priority?: ReportPriority;
}

export interface ReportHistoryEntry { id: string; action: string; actor?: string; created_at: string; details?: string; }
export interface ReportNote { id: string; body: string; author?: string; created_at: string; }
export interface ReportAttachment { id: string; filename: string; url: string; uploaded_at?: string; }
export interface ActionReport {
  id: string; summary: string; outcome: string;
  recommendations?: string; responder_id: string; created_at: string;
  planned_actions?: string; help_provided?: string[];
  case_opened?: boolean; case_number?: string; referral_agency?: string;
  victim_condition?: string; follow_up_required?: boolean; follow_up_date?: string;
}
export interface ActionReportInput {
  summary: string; outcome: string; recommendations?: string;
  planned_actions?: string; help_provided?: string[];
  case_opened?: boolean; case_number?: string; referral_agency?: string;
  victim_condition?: string; follow_up_required?: boolean; follow_up_date?: string;
  files?: File[];
}

export const HELP_OPTIONS = [
  "Counselling / psychosocial support",
  "Medical treatment",
  "Post-exposure prophylaxis (PEP)",
  "Forensic / medical examination",
  "Police statement recorded",
  "Docket / case opened (VSU)",
  "Suspect apprehended",
  "Protection / safety plan",
  "Safe shelter / accommodation",
  "Legal advice or representation",
  "Family mediation",
  "Child protection referral",
  "Transport / escort provided",
  "Food, clothing or material support",
  "Referred to another service provider",
  "Follow-up visit scheduled",
] as const;

export const VICTIM_CONDITIONS = [
  "Safe and stable", "Safe but needs follow-up", "Receiving medical care",
  "In temporary shelter", "Still at risk", "Unable to reach",
] as const;
export interface ReportDetail extends ReportListItem {
  description?: string; reporter_name?: string; reporter_phone?: string;
  gps_lat?: number | null; gps_lng?: number | null;
  notes?: ReportNote[]; history?: ReportHistoryEntry[]; attachments?: ReportAttachment[];
}
export interface ReportInput {
  category: string; description: string; province: string; district: string;
  reporter_name?: string; reporter_phone?: string;
  priority?: ReportPriority; gps_lat?: number | null; gps_lng?: number | null;
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.session) {
      const raw = (error?.message ?? "").toLowerCase();
      if (raw.includes("invalid login")) throw new Error("Incorrect email or password");
      if (raw.includes("email not confirmed")) throw new Error("Your email is not verified yet. Contact the Super Admin.");
      if (raw.includes("rate limit") || raw.includes("too many")) throw new Error("Too many attempts. Please wait a moment and try again.");
      throw new Error(error?.message || "Invalid credentials");
    }
    const me = await loadCurrentUser();
    if (!me) throw new Error("Could not load your account profile");
    if (me.status === "pending") { await supabase.auth.signOut(); throw new Error("Your account is awaiting approval"); }
    if (me.status === "suspended") { await supabase.auth.signOut(); throw new Error("Your account has been suspended"); }
    if (me.status === "rejected") { await supabase.auth.signOut(); throw new Error("Your account request was rejected"); }
    return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, user: me };
  },

  async register(body: {
    first_name: string; last_name: string; email: string;
    password: string; phone: string; role: Role;
    province?: string; district?: string; specialization?: string;
    department?: string; case_types?: string[];
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
          province: body.province,
          district: body.district,
          specialization: body.specialization,
          department: body.department,
          case_types: body.case_types,
        },
      },
    });
    if (error) throw new Error(error.message);
    // Best-effort: fill province/district/specialization on the freshly created profile.
    if (data.user && (body.province || body.district || body.specialization || body.department || body.case_types)) {
      try {
        await supabase.from("profiles").update({
          province: body.province ?? null,
          district: body.district ?? null,
          specialization: body.specialization ?? null,
          department: body.department ?? null,
          case_types: body.case_types ?? [],
        }).eq("user_id", data.user.id);
      } catch { /* ignore */ }
    }
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
    await adminApproveUserFn({ data: { target: id } });
    return { success: true };
  },
  async reject(id: string): Promise<{ success: boolean }> {
    await adminRejectUserFn({ data: { target: id } });
    return { success: true };
  },
  async suspend(id: string): Promise<{ success: boolean }> {
    await adminSuspendUserFn({ data: { target: id } });
    return { success: true };
  },
  async reactivate(id: string): Promise<{ success: boolean }> {
    await adminReactivateUserFn({ data: { target: id } });
    return { success: true };
  },
  async setRole(id: string, role: Role): Promise<{ success: boolean }> {
    await adminSetRoleFn({ data: { target: id, role } });
    return { success: true };
  },
  async remove(id: string): Promise<{ success: boolean }> {
    await adminDeleteUserFn({ data: { target: id } });
    return { success: true };
  },
};

// ============ responders (assignment engine) ============
export const responders = {
  async list(): Promise<ResponderWorkload[]> {
    const data = await responderWorkloadFn();
    const list = ((data ?? []) as ResponderWorkload[]).map((r) => ({
      ...r, open_cases: Number(r.open_cases ?? 0),
    }));
    if (list.length === 0) return list;
    const ids = list.map((r) => r.user_id);
    const { data: phones } = await supabase.from("profiles")
      .select("user_id,phone").in("user_id", ids);
    const phoneMap = new Map((phones ?? []).map((p) => [p.user_id, p.phone ?? undefined]));
    return list.map((r) => ({ ...r, phone: phoneMap.get(r.user_id) }));
  },
  async setAvailability(available: boolean): Promise<{ success: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("profiles")
      .update({ is_available: available }).eq("user_id", user.id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
  async setSpecialization(specialization: string): Promise<{ success: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("profiles")
      .update({ specialization }).eq("user_id", user.id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};


export const reports = {
  /** Records that the signed-in staff member opened this case (audit trail). */
  async logView(id: string): Promise<void> {
    try {
      await supabase.rpc("log_case_view", { _report_id: id });
    } catch {
      /* auditing must never block the case view */
    }
  },

  async list(params?: { status?: ReportStatus; priority?: ReportPriority; province?: string; district?: string; category?: string; q?: string; assignedTo?: string }): Promise<ReportListItem[]> {
    let q = supabase.from("reports").select("id,category,status,priority,created_at,province,district,assigned_to");
    if (params?.status) q = q.eq("status", params.status);
    if (params?.priority) q = q.eq("priority", params.priority);
    if (params?.province) q = q.eq("province", params.province);
    if (params?.district) q = q.eq("district", params.district);
    if (params?.category) q = q.eq("category", params.category);
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
      priority: (r.priority as ReportPriority | undefined) ?? "normal",
      created_at: r.created_at,
      province: r.province ?? undefined,
      district: r.district ?? undefined,
      assigned_to: r.assigned_to ?? null,
      description: r.description ?? undefined,
      reporter_name: r.reporter_name ?? undefined,
      reporter_phone: r.reporter_phone ?? undefined,
      gps_lat: (r as { gps_lat?: number | null }).gps_lat ?? null,
      gps_lng: (r as { gps_lng?: number | null }).gps_lng ?? null,
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
      priority: body.priority ?? "normal",
      gps_lat: body.gps_lat ?? null,
      gps_lng: body.gps_lng ?? null,
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

  async setPriority(id: string, priority: ReportPriority): Promise<{ success: boolean }> {
    const { error } = await supabase.from("reports").update({ priority }).eq("id", id);
    if (error) throw new Error(error.message);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("report_history").insert({ report_id: id, action: `priority:${priority}`, actor_id: user?.id ?? null });
    return { success: true };
  },

  async assign(id: string, responder_id: string): Promise<{ success: boolean }> {
    await assignReportFn({ data: { reportId: id, responderId: responder_id } });
    return { success: true };
  },

  async autoAssign(id: string): Promise<{ success: boolean; responder_id: string }> {
    return await autoAssignReportFn({ data: { reportId: id } });
  },

  async addNote(id: string, body: string): Promise<{ success: boolean; note: ReportNote }> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("report_notes")
      .insert({ report_id: id, body, author_id: user?.id ?? null })
      .select("id,body,author_id,created_at").single();
    if (error) throw new Error(error.message);
    return { success: true, note: { id: data.id, body: data.body, author: data.author_id ?? undefined, created_at: data.created_at } };
  },

  async listAttachments(id: string): Promise<ReportAttachment[]> {
    const { data, error } = await supabase.from("case_attachments")
      .select("id,filename,storage_path,created_at,uploaded_by,content_type")
      .eq("report_id", id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const out: ReportAttachment[] = [];
    for (const a of data ?? []) {
      const { data: signed } = await supabase.storage.from("case-attachments")
        .createSignedUrl(a.storage_path, 60 * 60);
      out.push({
        id: a.id,
        filename: a.filename,
        url: signed?.signedUrl ?? "",
        uploaded_at: a.created_at ?? undefined,
      });
    }
    return out;
  },

  async upload(id: string, file: File): Promise<{ success: boolean; attachment: ReportAttachment }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("case-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data, error } = await supabase.from("case_attachments").insert({
      report_id: id,
      storage_path: path,
      filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    }).select("id,filename,created_at").single();
    if (error) throw new Error(error.message);
    const { data: signed } = await supabase.storage.from("case-attachments").createSignedUrl(path, 60 * 60);
    return {
      success: true,
      attachment: { id: data.id, filename: data.filename, url: signed?.signedUrl ?? "", uploaded_at: data.created_at },
    };
  },

  async listActionReports(id: string): Promise<ActionReport[]> {
    const { data, error } = await supabase.from("action_reports")
      .select("id,summary,outcome,recommendations,responder_id,created_at,planned_actions,help_provided,case_opened,case_number,referral_agency,victim_condition,follow_up_required,follow_up_date")
      .eq("report_id", id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      summary: r.summary,
      outcome: r.outcome,
      recommendations: r.recommendations ?? undefined,
      planned_actions: r.planned_actions ?? undefined,
      help_provided: r.help_provided ?? [],
      case_opened: r.case_opened ?? false,
      case_number: r.case_number ?? undefined,
      referral_agency: r.referral_agency ?? undefined,
      victim_condition: r.victim_condition ?? undefined,
      follow_up_required: r.follow_up_required ?? false,
      follow_up_date: r.follow_up_date ?? undefined,
      responder_id: r.responder_id,
      created_at: r.created_at,
    }));
  },

  async submitActionReport(id: string, body: ActionReportInput): Promise<{ success: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const { data: ar, error } = await supabase.from("action_reports").insert({
      report_id: id,
      responder_id: user.id,
      summary: body.summary,
      outcome: body.outcome,
      recommendations: body.recommendations ?? null,
      planned_actions: body.planned_actions ?? null,
      help_provided: body.help_provided ?? [],
      case_opened: body.case_opened ?? false,
      case_number: body.case_number ?? null,
      referral_agency: body.referral_agency ?? null,
      victim_condition: body.victim_condition ?? null,
      follow_up_required: body.follow_up_required ?? false,
      follow_up_date: body.follow_up_date ?? null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    for (const file of body.files ?? []) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${id}/action-${ar.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("case-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      await supabase.from("case_attachments").insert({
        report_id: id,
        action_report_id: ar.id,
        storage_path: path,
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
    }
    await supabase.from("report_history").insert({
      report_id: id,
      action: "action_report_submitted",
      details: ar.id,
      actor_id: user.id,
    });
    return { success: true };
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

// ============ analytics ============
export interface AnalyticsBucket { key: string; count: number }
export interface AnalyticsOverview {
  totalReports: number;
  byStatus: AnalyticsBucket[];
  byPriority: AnalyticsBucket[];
  byCategory: AnalyticsBucket[];
  byProvince: AnalyticsBucket[];
  byDay: AnalyticsBucket[];
  avgResolutionHours: number | null;
}

function bucket(rows: Array<Record<string, unknown>>, field: string): AnalyticsBucket[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (r[field] as string | null | undefined) ?? "unknown";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

export const analytics = {
  async overview(range?: { from?: string; to?: string }): Promise<AnalyticsOverview> {
    let q = supabase.from("reports").select("id,status,priority,category,province,created_at,updated_at");
    if (range?.from) q = q.gte("created_at", range.from);
    if (range?.to) q = q.lte("created_at", range.to);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<Record<string, unknown>>;

    // avg resolution time for resolved/closed
    const resolved = rows.filter((r) => ["Resolved", "Closed"].includes(r.status as string));
    const hours = resolved
      .map((r) => (new Date(r.updated_at as string).getTime() - new Date(r.created_at as string).getTime()) / 3600000)
      .filter((h) => Number.isFinite(h) && h >= 0);
    const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;

    // per-day for last 30 days
    const dayMap = new Map<string, number>();
    for (const r of rows) {
      const d = new Date(r.created_at as string).toISOString().slice(0, 10);
      dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    }
    const byDay = Array.from(dayMap.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key));

    return {
      totalReports: rows.length,
      byStatus: bucket(rows, "status"),
      byPriority: bucket(rows, "priority"),
      byCategory: bucket(rows, "category"),
      byProvince: bucket(rows, "province"),
      byDay,
      avgResolutionHours: avg,
    };
  },

  toCSV(rows: ReportListItem[]): string {
    const headers = ["id", "category", "status", "priority", "province", "district", "assigned_to", "created_at"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","));
    }
    return lines.join("\n");
  },

  downloadCSV(filename: string, csv: string) {
    if (typeof window === "undefined") return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};

