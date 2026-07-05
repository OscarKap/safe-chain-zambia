import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, PlayCircle, HandHelping, FileText, X } from "lucide-react";
import { reports, responders, apiErrorMessage, type ReportStatus, type ReportListItem } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/responder/dashboard")({
  head: () => ({ meta: [{ title: "Responder dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ResponderDashboard,
});

const STATUS_BADGE: Record<string, string> = {
  Assigned: "bg-blue-50 text-blue-700 border-blue-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  En_Route: "bg-indigo-50 text-indigo-700 border-indigo-200",
  On_Scene: "bg-purple-50 text-purple-700 border-purple-200",
  In_Progress: "bg-amber-50 text-amber-700 border-amber-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  Resolved: "bg-slate-100 text-slate-700 border-slate-200",
  Closed: "bg-slate-100 text-slate-500 border-slate-200",
};

function ResponderDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [actionCase, setActionCase] = useState<ReportListItem | null>(null);
  const [reportCase, setReportCase] = useState<ReportListItem | null>(null);

  const reportsQ = useQuery({
    queryKey: ["reports", "mine", user?.id],
    queryFn: () => reports.list({ assignedTo: user?.id }),
    enabled: !!user, refetchInterval: 30_000,
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

  const changeStatus = useMutation({
    mutationFn: ({ id, s }: { id: string; s: ReportStatus }) => reports.setStatus(id, s),
    onSuccess: () => { toast.success("Case updated"); qc.invalidateQueries({ queryKey: ["reports", "mine", user?.id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const list = reportsQ.data ?? [];
  const active = list.filter((r) => !["Resolved", "Closed"].includes(r.status));
  const closed = list.filter((r) => r.status === "Resolved" || r.status === "Closed");
  const inProgress = active.filter((r) => r.status === "In_Progress" || r.status === "On_Scene" || r.status === "En_Route");
  const available = meQ.data?.is_available ?? true;

  return (
    <DashboardShell title="Responder Dashboard">
      <p className="text-sm text-muted-foreground -mt-4 mb-6">Live · auto-refresh every 30s</p>

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

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Assigned" value={list.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="In progress" value={inProgress.length} />
        <StatCard label="Closed" value={closed.length} />
      </div>

      <SectionCard title="My cases">
        {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
        {!reportsQ.isLoading && list.length === 0 && <p className="text-sm text-muted-foreground">No cases assigned yet.</p>}
        {list.length > 0 && (
          <ul className="divide-y divide-border">
            {list.map((r) => {
              const canAccept = r.status === "Assigned";
              const canProgress = ["Accepted", "En_Route", "On_Scene"].includes(r.status);
              const canResolve = !["Resolved", "Closed"].includes(r.status);
              return (
                <li key={r.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to="/admin/reports/$id" params={{ id: r.id }} className="font-medium hover:underline">
                          {r.category}
                        </Link>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.priority === "critical" ? "bg-red-500 text-white" : r.priority === "high" ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-700"}`}>
                          {r.priority ?? "normal"}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status] ?? "border-border"}`}>
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ref <span className="font-mono">{r.id.slice(0, 8).toUpperCase()}</span> · {r.district ?? "—"}, {r.province ?? "—"} · {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canAccept && (
                        <button
                          disabled={changeStatus.isPending}
                          onClick={() => changeStatus.mutate({ id: r.id, s: "Accepted" })}
                          className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
                        ><CheckCircle2 className="h-3.5 w-3.5" /> Accept</button>
                      )}
                      {canProgress && (
                        <button
                          disabled={changeStatus.isPending}
                          onClick={() => changeStatus.mutate({ id: r.id, s: "In_Progress" })}
                          className="rounded-full bg-amber-500 text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
                        ><PlayCircle className="h-3.5 w-3.5" /> Mark in progress</button>
                      )}
                      <button
                        onClick={() => setActionCase(r)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted inline-flex items-center gap-1"
                      ><HandHelping className="h-3.5 w-3.5" /> Request support</button>
                      {canResolve && (
                        <button
                          onClick={() => setReportCase(r)}
                          className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 inline-flex items-center gap-1"
                        ><FileText className="h-3.5 w-3.5" /> Submit action report</button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {actionCase && (
        <RequestSupportDialog
          caseItem={actionCase}
          onClose={() => setActionCase(null)}
          onDone={() => { setActionCase(null); qc.invalidateQueries({ queryKey: ["reports", "mine", user?.id] }); }}
        />
      )}
      {reportCase && (
        <ActionReportDialog
          caseItem={reportCase}
          onClose={() => setReportCase(null)}
          onDone={() => { setReportCase(null); qc.invalidateQueries({ queryKey: ["reports", "mine", user?.id] }); }}
        />
      )}
    </DashboardShell>
  );
}

function RequestSupportDialog({ caseItem, onClose, onDone }: { caseItem: ReportListItem; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const escalate = useMutation({
    mutationFn: async () => {
      if (note.trim()) await reports.addNote(caseItem.id, `[SUPPORT REQUESTED] ${note.trim()}`);
      await reports.setStatus(caseItem.id, "Escalated");
    },
    onSuccess: () => { toast.success("Case escalated — admins notified via activity feed"); onDone(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  return (
    <Modal title="Request support" onClose={onClose}>
      <p className="text-sm text-muted-foreground mb-3">
        This will escalate case <span className="font-mono">{caseItem.id.slice(0,8)}</span> so admins can reassign or intervene.
      </p>
      <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Describe what support you need…"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
        <button disabled={escalate.isPending} onClick={() => escalate.mutate()}
          className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" /> {escalate.isPending ? "Escalating…" : "Escalate"}
        </button>
      </div>
    </Modal>
  );
}

function ActionReportDialog({ caseItem, onClose, onDone }: { caseItem: ReportListItem; onClose: () => void; onDone: () => void }) {
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("resolved");
  const [recommendations, setRecommendations] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const submit = useMutation({
    mutationFn: async () => {
      await reports.submitActionReport(caseItem.id, { summary, outcome, recommendations: recommendations || undefined, files });
      if (outcome === "resolved") await reports.setStatus(caseItem.id, "Resolved");
    },
    onSuccess: () => { toast.success("Action report submitted"); onDone(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Modal title={`Action report — ${caseItem.category}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="resolved">Resolved — case closed</option>
            <option value="referred">Referred to another agency</option>
            <option value="pending">Ongoing — further action required</option>
            <option value="unable_to_reach">Unable to reach reporter</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Action summary *</label>
          <textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="What actions were taken, by whom, and when?"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Recommendations</label>
          <textarea rows={3} value={recommendations} onChange={(e) => setRecommendations(e.target.value)}
            placeholder="Follow-up, referrals, prevention notes…"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Supporting files (PDF/JPG/PNG)</label>
          <input type="file" multiple accept="image/*,application/pdf"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
          />
          {files.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{files.length} file(s) selected</p>}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
        <button
          disabled={submit.isPending || summary.trim().length < 10}
          onClick={() => submit.mutate()}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >{submit.isPending ? "Submitting…" : "Submit action report"}</button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
