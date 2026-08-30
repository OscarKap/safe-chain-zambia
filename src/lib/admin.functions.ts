// Server-side privileged RPC wrappers.
// Frontend calls these instead of invoking SECURITY DEFINER SQL functions
// directly via Supabase RPC. This lets us revoke EXECUTE from the
// `authenticated` role on those SQL functions and satisfy the
// SECURITY DEFINER linter (0028/0029) without breaking admin workflows.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuidSchema = z.object({ target: z.string().uuid() });
const roleValues = [
  "super_admin", "admin", "responder", "gbv_officer",
  "counsellor", "developer", "gbv_responder", "clinic_admin",
  "community_volunteer", "data_reviewer",
] as const;
const setRoleSchema = z.object({
  target: z.string().uuid(),
  role: z.enum(roleValues),
});
const reportIdSchema = z.object({ reportId: z.string().uuid() });
const assignSchema = z.object({
  reportId: z.string().uuid(),
  responderId: z.string().uuid(),
});

async function callAdminRpc(name: string, args: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data;
}

// Sensitive actions (suspend, role change, delete) need a fresh password
// confirmation within the last few minutes.
async function stepUp(userId: string) {
  const { requireReauth } = await import("@/lib/security.server");
  await requireReauth(userId);
}

export const adminApproveUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uuidSchema.parse(d))
  .handler(async ({ data, context }) => {
    await callAdminRpc("admin_approve_user", { _target: data.target, _caller: context.userId });
    return { success: true };
  });

export const adminRejectUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uuidSchema.parse(d))
  .handler(async ({ data, context }) => {
    await callAdminRpc("admin_reject_user", { _target: data.target, _caller: context.userId });
    return { success: true };
  });

export const adminSuspendUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uuidSchema.parse(d))
  .handler(async ({ data, context }) => {
    await stepUp(context.userId);
    await callAdminRpc("admin_suspend_user", { _target: data.target, _caller: context.userId });
    return { success: true };
  });

export const adminReactivateUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uuidSchema.parse(d))
  .handler(async ({ data, context }) => {
    await callAdminRpc("admin_reactivate_user", { _target: data.target, _caller: context.userId });
    return { success: true };
  });

export const adminSetRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => setRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await stepUp(context.userId);
    await callAdminRpc("admin_set_user_role", { _target: data.target, _role: data.role, _caller: context.userId });
    return { success: true };
  });

export const adminDeleteUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uuidSchema.parse(d))
  .handler(async ({ data, context }) => {
    await stepUp(context.userId);
    await callAdminRpc("admin_delete_user", { _target: data.target, _caller: context.userId });
    return { success: true };
  });

export const responderWorkloadFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return (await callAdminRpc("responder_workload", {})) ?? [];
  });

export const autoAssignReportFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reportIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const responderId = await callAdminRpc("auto_assign_report", { _report_id: data.reportId, _caller: context.userId });
    return { success: true, responder_id: String(responderId) };
  });

export const assignReportFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => assignSchema.parse(d))
  .handler(async ({ data, context }) => {
    await callAdminRpc("assign_report_to", {
      _report_id: data.reportId,
      _responder_id: data.responderId,
      _caller: context.userId,
    });
    return { success: true };
  });
