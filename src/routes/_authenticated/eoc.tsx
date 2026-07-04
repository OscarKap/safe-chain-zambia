import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Activity, Users, Clock, MapPin } from "lucide-react";
import { reports, responders, dashboard, ROLE_LABEL } from "@/lib/api";
import { DashboardShell, StatCard, SectionCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/eoc")({
  head: () => ({ meta: [{ title: "Emergency Operations — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EOC,
});

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  normal: "bg-blue-500 text-white",
  low: "bg-slate-400 text-white",
};

function EOC() {
  const { user } = useAuth();
  const statsQ = useQuery({
    queryKey: ["eoc", "stats"], queryFn: dashboard.superAdmin,
    refetchInterval: 30_000, enabled: !!user,
  });
  const reportsQ = useQuery({
    queryKey: ["eoc", "reports"], queryFn: () => reports.list(),
    refetchInterval: 30_000, enabled: !!user,
  });
  const respondersQ = useQuery({
    queryKey: ["eoc", "responders"], queryFn: responders.list,
    refetchInterval: 60_000, enabled: !!user,
  });

  const all = reportsQ.data ?? [];
  const open = all.filter((r) => !["Resolved", "Closed"].includes(r.status));
  const critical = open.filter((r) => r.priority === "critical");
  const unassigned = open.filter((r) => !r.assigned_to);
  const active = respondersQ.data ?? [];
  const availableResponders = active.filter((r) => r.is_available).length;

  return (
    <DashboardShell title="Emergency Operations Centre">
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Live view · auto-refresh every 30s · role: {user ? ROLE_LABEL[user.role] : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Open cases" value={open.length} />
        <StatCard label="Critical" value={critical.length} />
        <StatCard label="Unassigned" value={unassigned.length} />
        <StatCard label={`Responders available`} value={`${availableResponders}/${active.length}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Critical & unassigned"
            action={<Link to="/admin/reports" className="text-sm text-brand">All reports →</Link>}
          >
            {critical.length === 0 && unassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing urgent right now.</p>
            ) : (
              <ul className="divide-y divide-border">
                {[...critical, ...unassigned.filter((u) => !critical.includes(u))].slice(0, 10).map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_COLOR[r.priority ?? "normal"]}`}>
                          {(r.priority ?? "normal").toUpperCase()}
                        </span>
                        <span className="text-sm font-medium truncate">{r.category}</span>
                        <span className="text-xs text-muted-foreground">· {r.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {r.district ?? "?"}, {r.province ?? "?"} · {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to="/admin/reports/$id" params={{ id: r.id }}
                      className="text-xs rounded-full border border-border px-3 py-1 hover:bg-muted shrink-0"
                    >Open</Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recent activity">
            <ul className="divide-y divide-border">
              {all.slice(0, 8).map((r) => (
                <li key={r.id} className="py-2.5 flex items-center gap-3 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{r.category}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {r.district ?? "—"} · {r.status}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {new Date(r.created_at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Responder workload">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active responders.</p>
            ) : (
              <ul className="space-y-2">
                {active.slice(0, 10).map((r) => {
                  const load = r.max_active_cases > 0 ? r.open_cases / r.max_active_cases : 0;
                  return (
                    <li key={r.user_id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          <Users className="inline h-3 w-3 mr-1 text-muted-foreground" />
                          {r.first_name ?? r.email} {r.last_name ?? ""}
                        </span>
                        <span className={`text-xs ${r.is_available ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {r.is_available ? "available" : "off duty"}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-muted rounded overflow-hidden">
                        <div
                          className={`h-full ${load >= 1 ? "bg-red-500" : load > 0.7 ? "bg-orange-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, load * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {r.open_cases}/{r.max_active_cases} · {r.district ?? "—"} · {r.specialization ?? "general"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="System snapshot">
            {statsQ.data ? (
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Total users</dt><dd className="text-right font-medium">{statsQ.data.totalUsers}</dd>
                <dt className="text-muted-foreground">Pending approvals</dt><dd className="text-right font-medium">{statsQ.data.pendingUsers}</dd>
                <dt className="text-muted-foreground">Total reports</dt><dd className="text-right font-medium">{statsQ.data.totalReports}</dd>
                <dt className="text-muted-foreground">Resolved</dt><dd className="text-right font-medium">{statsQ.data.resolvedReports}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            <div className="mt-4 flex gap-2">
              <Link to="/admin/analytics" className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1.5">Analytics →</Link>
              <Link to="/admin/dashboard" className="text-xs rounded-full border border-border px-3 py-1.5">Admin panel</Link>
            </div>
          </SectionCard>

          {critical.length > 0 && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300 flex gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{critical.length} critical case{critical.length === 1 ? "" : "s"} need attention</p>
                <p className="text-xs opacity-80 mt-1">Assign or escalate immediately.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
