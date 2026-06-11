import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reports, notifications, apiErrorMessage } from "@/lib/api";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/gbv/dashboard")({
  head: () => ({ meta: [{ title: "GBV Officer dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: GbvDashboard,
});

function GbvDashboard() {
  const { user } = useAuth();
  const reportsQ = useQuery({ queryKey: ["reports", "gbv"], queryFn: () => reports.list(), enabled: !!user });
  const notifQ = useQuery({ queryKey: ["notifications"], queryFn: notifications.list, enabled: !!user });

  const gbvList = (reportsQ.data ?? []).filter((r) => r.category === "GBV" || r.category === "Assault");
  const open = gbvList.filter((r) => r.status !== "Resolved" && r.status !== "Closed");

  return (
    <DashboardShell title="GBV Officer Dashboard">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="GBV cases" value={gbvList.length} />
        <StatCard label="Open" value={open.length} />
        <StatCard label="Total reports" value={reportsQ.data?.length ?? 0} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="GBV / assault cases">
          {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
          {gbvList.length === 0 && !reportsQ.isLoading && <p className="text-sm text-muted-foreground">No GBV cases yet.</p>}
          <ul className="divide-y divide-border">
            {gbvList.slice(0, 10).map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <div><p className="font-medium">{r.category}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p></div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Notifications">
          {notifQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {notifQ.data && notifQ.data.length === 0 && <p className="text-sm text-muted-foreground">No notifications.</p>}
          <ul className="space-y-2">
            {notifQ.data?.slice(0, 10).map((n) => (
              <li key={n.id} className={`text-sm rounded-lg border border-border p-3 ${n.read ? "opacity-60" : ""}`}>{n.message}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
