import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reports, notifications, apiErrorMessage } from "@/lib/api";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

function makeRoleDashboard(role: string, title: string) {
  function Page() {
    const { user } = useAuth();
    const reportsQ = useQuery({ queryKey: ["reports"], queryFn: reports.list, enabled: !!user });
    const notifQ = useQuery({ queryKey: ["notifications"], queryFn: notifications.list, enabled: !!user });

    const total = reportsQ.data?.length ?? 0;
    const open = reportsQ.data?.filter((r) => r.status === "New" || r.status === "In_Progress").length ?? 0;
    const resolved = reportsQ.data?.filter((r) => r.status === "Resolved" || r.status === "Closed").length ?? 0;

    return (
      <DashboardShell title={title}>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total reports" value={total} />
          <StatCard label="Open" value={open} />
          <StatCard label="Resolved" value={resolved} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SectionCard title="Reports">
            {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
            {reportsQ.data && reportsQ.data.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
            <ul className="divide-y divide-border">
              {reportsQ.data?.slice(0, 15).map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{r.category}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
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
              {notifQ.data?.slice(0, 15).map((n) => (
                <li key={n.id} className={`text-sm rounded-lg border border-border p-3 ${n.read ? "opacity-60" : ""}`}>
                  {n.message}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
        <p className="sr-only">Role: {role}</p>
      </DashboardShell>
    );
  }
  return Page;
}

export { makeRoleDashboard };
export const Route = createFileRoute("/_authenticated/responder/dashboard")({
  head: () => ({ meta: [{ title: "Responder dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: makeRoleDashboard("responder", "Responder Dashboard"),
});
