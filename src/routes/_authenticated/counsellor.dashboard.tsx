import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reports, notifications, apiErrorMessage } from "@/lib/api";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/counsellor/dashboard")({
  head: () => ({ meta: [{ title: "Counsellor dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CounsellorDashboard,
});

function CounsellorDashboard() {
  const { user } = useAuth();
  const reportsQ = useQuery({ queryKey: ["reports", "counsellor"], queryFn: () => reports.list(), enabled: !!user });
  const notifQ = useQuery({ queryKey: ["notifications"], queryFn: notifications.list, enabled: !!user });

  const list = reportsQ.data ?? [];
  const active = list.filter((r) => r.status === "Assigned" || r.status === "In_Progress");
  const resolved = list.filter((r) => r.status === "Resolved" || r.status === "Closed");

  return (
    <DashboardShell title="Counsellor Dashboard">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Cases" value={list.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="Resolved" value={resolved.length} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Recent cases">
          {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
          {list.length === 0 && !reportsQ.isLoading && <p className="text-sm text-muted-foreground">No cases yet.</p>}
          <ul className="divide-y divide-border">
            {list.slice(0, 10).map((r) => (
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
