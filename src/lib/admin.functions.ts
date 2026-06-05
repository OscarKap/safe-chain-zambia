import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ROLES = [
  "super_admin",
  "gbv_responder",
  "clinic_admin",
  "community_volunteer",
  "counsellor",
  "data_reviewer",
] as const;
export type AppRole = (typeof ROLES)[number];

const requestSchema = z.object({
  full_name: z.string().trim().min(2).max(200),
  job_title: z.string().trim().min(2).max(200),
  organisation: z.string().trim().min(2).max(200),
  province: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(320),
  reason: z.string().trim().min(10).max(5000),
  requested_role: z.enum(ROLES),
  confirm_accurate: z.literal(true),
});

// PUBLIC — anyone can submit. No auth middleware.
export const submitAdminRequest = createServerFn({ method: "POST" })
  .inputValidator((input) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })();
    const ua = (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })();

    // Simple spam guard: max 3 pending for the same email
    const { count } = await supabaseAdmin
      .from("admin_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email.toLowerCase())
      .eq("status", "pending");
    if ((count ?? 0) >= 3) {
      return { ok: false as const, error: "You already have pending requests under this email. Please wait for review." };
    }

    const { error } = await supabaseAdmin.from("admin_access_requests").insert({
      full_name: data.full_name,
      job_title: data.job_title,
      organisation: data.organisation,
      province: data.province,
      district: data.district,
      phone: data.phone,
      email: data.email.toLowerCase(),
      reason: data.reason,
      requested_role: data.requested_role,
      ip_address: ip,
      user_agent: ua,
    });
    if (error) {
      console.error("submitAdminRequest insert error", error);
      return { ok: false as const, error: "Could not submit your request. Please try again." };
    }
    return { ok: true as const };
  });

// AUTH HELPERS ----------------------------------------------------------------
async function assertSuperAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: super admin only");
}

async function logActivity(args: {
  actor_user_id: string;
  actor_email?: string | null;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })();
  await supabaseAdmin.from("admin_activity_logs").insert({
    actor_user_id: args.actor_user_id,
    actor_email: args.actor_email ?? null,
    action: args.action,
    target_type: args.target_type ?? null,
    target_id: args.target_id ?? null,
    metadata: args.metadata ?? {},
    ip_address: ip,
  });
}

// Returns current user's roles + profile so client can route appropriately.
export const getMyAdminContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin.from("admin_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      userId,
      email: (context.claims.email as string | undefined) ?? null,
      roles: (roles ?? []).map((r) => r.role as AppRole),
      profile: profile ?? null,
    };
  });

// SUPER-ADMIN ONLY ------------------------------------------------------------
export const listAdminRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { status?: "pending" | "approved" | "rejected" | "suspended" | "all" }) => i ?? {})
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("admin_access_requests").select("*").order("created_at", { ascending: false }).limit(500);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin.from("admin_profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return { profiles: profiles ?? [], roles: roles ?? [] };
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
    return { rows: data ?? [] };
  });

const approveSchema = z.object({ id: z.string().uuid(), notes: z.string().max(2000).optional() });
export const approveRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => approveSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: rErr } = await supabaseAdmin
      .from("admin_access_requests").select("*").eq("id", data.id).maybeSingle();
    if (rErr || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error(`Request is already ${req.status}`);

    // Find or create the auth user, then invite them by email with a redirect to /account/setup.
    const redirectTo = (() => {
      try { const origin = getRequestHeader("origin"); if (origin) return `${origin}/account/setup`; } catch { /* ignore */ }
      return undefined;
    })();

    let userId: string | null = null;
    // Try invite first (sends email if Supabase email is enabled)
    const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(req.email, {
      data: { full_name: req.full_name },
      redirectTo,
    });
    if (invite.data?.user?.id) {
      userId = invite.data.user.id;
    } else {
      // User may already exist; look them up.
      const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list.data?.users.find((u) => (u.email ?? "").toLowerCase() === req.email.toLowerCase());
      if (found) {
        userId = found.id;
      } else {
        // As a fallback create the user directly with a temporary password.
        const tempPassword = `Sc-${crypto.randomUUID().slice(0, 10)}!A1`;
        const created = await supabaseAdmin.auth.admin.createUser({
          email: req.email,
          password: tempPassword,
          email_confirm: false,
          user_metadata: { full_name: req.full_name, temp_password: true },
        });
        if (created.error || !created.data?.user) {
          console.error("approveRequest createUser error", created.error);
          throw new Error("Could not create the admin account.");
        }
        userId = created.data.user.id;
      }
    }

    if (!userId) throw new Error("Failed to resolve admin user id");

    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: req.requested_role, granted_by: context.userId },
      { onConflict: "user_id,role" },
    );
    await supabaseAdmin.from("admin_profiles").upsert({
      user_id: userId,
      full_name: req.full_name,
      phone: req.phone,
      organisation: req.organisation,
      province: req.province,
      district: req.district,
      must_change_password: true,
    });
    await supabaseAdmin
      .from("admin_access_requests")
      .update({
        status: "approved",
        review_notes: data.notes ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    await logActivity({
      actor_user_id: context.userId,
      actor_email: (context.claims.email as string | undefined) ?? null,
      action: "approve_request",
      target_type: "admin_access_request",
      target_id: data.id,
      metadata: { email: req.email, role: req.requested_role, invited: Boolean(invite.data?.user) },
    });
    return { ok: true as const, userId };
  });

const decideSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["rejected", "suspended", "pending"]),
  notes: z.string().max(2000).optional(),
});
export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => decideSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_access_requests").update({
      status: data.status,
      review_notes: data.notes ?? null,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity({
      actor_user_id: context.userId,
      actor_email: (context.claims.email as string | undefined) ?? null,
      action: `request_${data.status}`,
      target_type: "admin_access_request",
      target_id: data.id,
      metadata: { notes: data.notes ?? null },
    });
    return { ok: true as const };
  });

const passwordSchema = z.object({
  password: z.string().min(10).max(128)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
  accept_privacy: z.literal(true),
});
export const completeFirstLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => passwordSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const upd = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password });
    if (upd.error) throw new Error(upd.error.message);
    await supabaseAdmin.from("admin_profiles").upsert({
      user_id: context.userId,
      full_name: (context.claims as { user_metadata?: { full_name?: string } }).user_metadata?.full_name ?? "Admin",
      must_change_password: false,
      accepted_privacy_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    });
    await logActivity({
      actor_user_id: context.userId,
      actor_email: (context.claims.email as string | undefined) ?? null,
      action: "first_login_completed",
    });
    return { ok: true as const };
  });
