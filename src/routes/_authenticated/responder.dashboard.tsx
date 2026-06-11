import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reports, apiErrorMessage } from "@/lib/api";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/responder/dashboard")({
  head: () => ({ meta: [{ title: "Responder dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ResponderDashboard,
});

function ResponderDashboard() {
  const { user } = useAuth();
  const reportsQ = useQuery({
    queryKey: ["reports", "mine", user?.id],
    queryFn: () => reports.list({ assignedTo: user?.id }),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const list = reportsQ.data ?? [];
  const active = list.filter((r) => r.status === "Assigned" || r.status === "In_Progress" || r.status === "Escalated");
  const closed = list.filter((r) => r.status === "Resolved" || r.status === "Closed");

  return (
    <DashboardShell title="Responder Dashboard">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Assigned cases" value={list.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="Closed" value={closed.length} />
      </div>

      <SectionCard title="My cases">
        {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
        {!reportsQ.isLoading && list.length === 0 && <p className="text-sm text-muted-foreground">No cases assigned yet.</p>}
        {list.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-2 py-2 font-medium">Reference</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="px-2 py-3 font-mono text-xs">
                      <Link to="/admin/reports/$id" params={{ id: r.id }} className="text-brand hover:underline">{r.id.slice(0, 8)}…</Link>
                    </td>
                    <td className="px-2 py-3 font-medium">{r.category}</td>
                    <td className="px-2 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.status}</span></td>
                    <td className="px-2 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
