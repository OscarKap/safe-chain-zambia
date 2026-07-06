import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { reports, apiErrorMessage, REPORT_STATUSES, type ReportStatus } from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminReportsRoute,
});

function AdminReportsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname.replace(/\/$/, "") });
  if (pathname !== "/admin/reports") return <Outlet />;
  return <ReportsList />;
}

function ReportsList() {
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [q, setQ] = useState("");
  const reportsQ = useQuery({
    queryKey: ["reports", status, q],
    queryFn: () => reports.list({ status: status || undefined, q: q || undefined }),
  });

  return (
    <DashboardShell title="All reports">
      <SectionCard
        title={`Reports${reportsQ.data ? ` (${reportsQ.data.length})` : ""}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                className="pl-7 pr-3 py-1.5 text-xs rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-ring w-56"
              />
            </div>
            <select
              value={status} onChange={(e) => setStatus(e.target.value as ReportStatus | "")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All statuses</option>
              {REPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      >
        {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
        {reportsQ.data && reportsQ.data.length === 0 && <p className="text-sm text-muted-foreground">No reports match.</p>}
        {reportsQ.data && reportsQ.data.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-2 py-2 font-medium">Reference</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Location</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportsQ.data.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="px-2 py-3 font-mono text-xs">
                      <Link to="/admin/reports/$id" params={{ id: r.id }} className="text-brand hover:underline">{r.id.slice(0, 8)}…</Link>
                    </td>
                    <td className="px-2 py-3 font-medium">{r.category}</td>
                    <td className="px-2 py-3 text-muted-foreground">{[r.district, r.province].filter(Boolean).join(", ") || "—"}</td>
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
