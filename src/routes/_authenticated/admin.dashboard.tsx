import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  dashboard, users, reports, notifications, facilities,
  apiErrorMessage, ALL_ROLES, ROLE_LABEL, type Role, type ManagedUser,
} from "@/lib/api";
import { DashboardShell, StatCard, SectionCard } from "@/components/DashboardShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminDashboard,
});

type Action = { kind: "approve" | "reject" | "suspend" | "reactivate"; user: ManagedUser } | null;

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (user && user.role !== "super_admin" && user.role !== "admin") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);

  const isSuper = user?.role === "super_admin";

  const statsQ = useQuery({
    queryKey: ["dashboard", isSuper ? "super-admin" : "admin"],
    queryFn: () => (isSuper ? dashboard.superAdmin() : dashboard.admin()),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const pendingQ = useQuery({ queryKey: ["users", "pending"], queryFn: users.pending, enabled: isSuper, refetchInterval: 60_000 });
  const reportsQ = useQuery({ queryKey: ["reports"], queryFn: () => reports.list(), enabled: !!user, refetchInterval: 60_000 });
  const facilitiesQ = useQuery({ queryKey: ["facilities"], queryFn: facilities.list, enabled: isSuper, retry: 1 });

  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [search, setSearch] = useState("");
  const allUsersQ = useQuery({
    queryKey: ["users", "all", roleFilter, search],
    queryFn: () => users.list({ role: roleFilter || undefined, q: search || undefined }),
    enabled: isSuper,
  });

  const [confirm, setConfirm] = useState<Action>(null);

  const approve = useMutation({
    mutationFn: (id: string) => users.approve(id),
    onSuccess: () => { toast.success("User approved"); qc.invalidateQueries({ queryKey: ["users"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); setConfirm(null); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const reject = useMutation({
    mutationFn: (id: string) => users.reject(id),
    onSuccess: () => { toast.success("User rejected"); qc.invalidateQueries({ queryKey: ["users"] }); setConfirm(null); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const suspend = useMutation({
    mutationFn: (id: string) => users.suspend(id),
    onSuccess: () => { toast.success("User suspended"); qc.invalidateQueries({ queryKey: ["users"] }); setConfirm(null); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const reactivate = useMutation({
    mutationFn: (id: string) => users.reactivate(id),
    onSuccess: () => { toast.success("User reactivated"); qc.invalidateQueries({ queryKey: ["users"] }); setConfirm(null); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const setRoleM = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => users.setRole(id, role),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const notifQ = useQuery({ queryKey: ["notifications"], queryFn: notifications.list, enabled: !!user, refetchInterval: 60_000 });

  if (!user) return null;

  return (
    <DashboardShell title={isSuper ? "Super Admin Dashboard" : "Admin Dashboard"}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsQ.isLoading && <p className="text-sm text-muted-foreground">Loading stats…</p>}
        {statsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(statsQ.error)}</p>}
        {statsQ.data && isSuper && <SuperStats s={statsQ.data as Awaited<ReturnType<typeof dashboard.superAdmin>>} unread={notifQ.data?.filter((n) => !n.read).length} />}
        {statsQ.data && !isSuper && <AdminStatsView s={statsQ.data as Awaited<ReturnType<typeof dashboard.admin>>} />}
      </div>

      {isSuper && (
        <SectionCard title={`Pending user approvals${pendingQ.data ? ` (${pendingQ.data.length})` : ""}`}>
          {pendingQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {pendingQ.error && <p className="text-sm text-destructive">{apiErrorMessage(pendingQ.error)}</p>}
          {pendingQ.data && pendingQ.data.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
          {pendingQ.data && pendingQ.data.length > 0 && (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Email</th>
                    <th className="px-2 py-2 font-medium">Province</th>
                    <th className="px-2 py-2 font-medium">District</th>
                    <th className="px-2 py-2 font-medium">Role</th>
                    <th className="px-2 py-2 font-medium">Registered</th>
                    <th className="px-2 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingQ.data.map((u) => (
                    <tr key={u.id}>
                      <td className="px-2 py-3 font-medium">{u.first_name} {u.last_name}</td>
                      <td className="px-2 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-2 py-3">{u.province ?? "—"}</td>
                      <td className="px-2 py-3">{u.district ?? "—"}</td>
                      <td className="px-2 py-3">{ROLE_LABEL[u.role]}</td>
                      <td className="px-2 py-3 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-2 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => setConfirm({ kind: "approve", user: { ...u, status: "pending" } })} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Approve</button>
                          <button onClick={() => setConfirm({ kind: "reject", user: { ...u, status: "pending" } })} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <SectionCard title="Recent reports" action={<Link to="/admin/reports" className="text-xs text-brand hover:underline">View all</Link>}>
          {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
          {reportsQ.data && reportsQ.data.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
          <ul className="divide-y divide-border">
            {reportsQ.data?.slice(0, 8).map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <Link to="/admin/reports/$id" params={{ id: r.id }} className="flex-1 hover:underline">
                  <p className="font-medium">{r.category}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </Link>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Notifications">
          {notifQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {notifQ.error && <p className="text-sm text-destructive">{apiErrorMessage(notifQ.error)}</p>}
          {notifQ.data && notifQ.data.length === 0 && <p className="text-sm text-muted-foreground">No notifications.</p>}
          <ul className="space-y-2">
            {notifQ.data?.slice(0, 8).map((n) => (
              <li key={n.id} className={`text-sm rounded-lg border border-border p-3 ${n.read ? "opacity-60" : ""}`}>
                {n.message}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {isSuper && (
        <SectionCard title="All users" action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email"
                className="pl-7 pr-3 py-1.5 text-xs rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-ring w-56"
              />
            </div>
            <select
              value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All roles</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        }>
          {allUsersQ.isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
          {allUsersQ.error && <p className="text-sm text-destructive">{apiErrorMessage(allUsersQ.error)}</p>}
          {allUsersQ.data && allUsersQ.data.length === 0 && <p className="text-sm text-muted-foreground">No users match.</p>}
          {allUsersQ.data && allUsersQ.data.length > 0 && (
            <div className="overflow-x-auto -mx-2 mt-3">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Email</th>
                    <th className="px-2 py-2 font-medium">Role</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allUsersQ.data.map((u) => (
                    <tr key={u.id}>
                      <td className="px-2 py-3 font-medium">{u.first_name} {u.last_name}</td>
                      <td className="px-2 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-2 py-3">
                        <select
                          defaultValue={u.role}
                          onChange={(e) => setRoleM.mutate({ id: u.id, role: e.target.value as Role })}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          u.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                          u.status === "suspended" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" :
                          u.status === "rejected" ? "bg-destructive/15 text-destructive" :
                          "bg-muted"
                        }`}>{u.status}</span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        {u.status === "active" && (
                          <button onClick={() => setConfirm({ kind: "suspend", user: u })} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">Suspend</button>
                        )}
                        {u.status === "suspended" && (
                          <button onClick={() => setConfirm({ kind: "reactivate", user: u })} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90">Reactivate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {isSuper && facilitiesQ.data && (
        <SectionCard title={`Facilities (${facilitiesQ.data.length})`}>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {facilitiesQ.data.slice(0, 12).map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{[f.type, f.district, f.province].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <ConfirmFromAction
        action={confirm} onCancel={() => setConfirm(null)}
        busy={approve.isPending || reject.isPending || suspend.isPending || reactivate.isPending}
        onConfirm={() => {
          if (!confirm) return;
          const id = confirm.user.id;
          if (confirm.kind === "approve") approve.mutate(id);
          else if (confirm.kind === "reject") reject.mutate(id);
          else if (confirm.kind === "suspend") suspend.mutate(id);
          else reactivate.mutate(id);
        }}
      />
    </DashboardShell>
  );
}

function ConfirmFromAction({ action, onCancel, onConfirm, busy }: { action: Action; onCancel: () => void; onConfirm: () => void; busy: boolean }) {
  const cfg = useMemo(() => {
    if (!action) return null;
    const name = `${action.user.first_name} ${action.user.last_name}`;
    if (action.kind === "approve") return { title: "Approve user?", message: `Grant ${name} access as ${ROLE_LABEL[action.user.role]}?`, confirmLabel: "Approve", destructive: false };
    if (action.kind === "reject") return { title: "Reject user?", message: `Permanently reject the access request from ${name}?`, confirmLabel: "Reject", destructive: true };
    if (action.kind === "suspend") return { title: "Suspend user?", message: `Suspend ${name}? They won't be able to sign in until reactivated.`, confirmLabel: "Suspend", destructive: true };
    return { title: "Reactivate user?", message: `Restore access for ${name}?`, confirmLabel: "Reactivate", destructive: false };
  }, [action]);

  return (
    <ConfirmDialog
      open={!!action && !!cfg}
      title={cfg?.title ?? ""}
      message={cfg?.message ?? ""}
      confirmLabel={cfg?.confirmLabel}
      destructive={cfg?.destructive}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function SuperStats({ s, unread }: { s: { totalUsers: number; pendingUsers: number; activeUsers?: number; totalReports: number; openReports: number; resolvedReports: number; totalFacilities: number }; unread?: number }) {
  return (
    <>
      <StatCard label="Total users" value={s.totalUsers} />
      <StatCard label="Pending approvals" value={s.pendingUsers} />
      <StatCard label="Active users" value={s.activeUsers ?? (s.totalUsers - s.pendingUsers)} />
      <StatCard label="Open reports" value={s.openReports} />
      <StatCard label="Resolved reports" value={s.resolvedReports} />
      <StatCard label="Facilities" value={s.totalFacilities} />
      <StatCard label="Total reports" value={s.totalReports} />
      <StatCard label="Unread notifications" value={unread ?? 0} />
    </>
  );
}

function AdminStatsView({ s }: { s: { totalReports: number; assignedReports: number; openReports: number; resolvedReports?: number } }) {
  return (
    <>
      <StatCard label="Total reports" value={s.totalReports} />
      <StatCard label="Assigned" value={s.assignedReports} />
      <StatCard label="Open" value={s.openReports} />
      <StatCard label="Resolved" value={s.resolvedReports ?? 0} />
    </>
  );
}
