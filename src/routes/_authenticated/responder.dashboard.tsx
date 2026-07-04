import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reports, responders, apiErrorMessage } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/responder/dashboard")({
  head: () => ({ meta: [{ title: "Responder dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ResponderDashboard,
});

function ResponderDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const reportsQ = useQuery({
    queryKey: ["reports", "mine", user?.id],
    queryFn: () => reports.list({ assignedTo: user?.id }),
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const meQ = useQuery({
    queryKey: ["me-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("is_available,specialization,max_active_cases").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const setAvail = useMutation({
    mutationFn: (a: boolean) => responders.setAvailability(a),
    onSuccess: () => { toast.success("Availability updated"); qc.invalidateQueries({ queryKey: ["me-profile", user?.id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const list = reportsQ.data ?? [];
  const active = list.filter((r) => !["Resolved", "Closed"].includes(r.status));
  const closed = list.filter((r) => r.status === "Resolved" || r.status === "Closed");
  const available = meQ.data?.is_available ?? true;

  return (
    <DashboardShell title="Responder Dashboard">
      <div className="card-soft p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Duty status</p>
          <p className="text-xs text-muted-foreground">
            {available ? "You are receiving new case assignments." : "You are OFF DUTY. No new cases will be auto-assigned."}
            {meQ.data?.specialization && ` · Specialization: ${meQ.data.specialization}`}
          </p>
        </div>
        <button
          onClick={() => setAvail.mutate(!available)}
          disabled={setAvail.isPending}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${available ? "bg-emerald-500 text-white" : "bg-muted text-foreground"} disabled:opacity-60`}
        >
          {available ? "● Available" : "○ Off duty"}
        </button>
      </div>

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
