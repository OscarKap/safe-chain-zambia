import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, MapPin, AlertTriangle, CheckCircle2, Circle, Phone, Mail, X } from "lucide-react";
import {
  reports, responders, apiErrorMessage,
  REPORT_STATUSES, REPORT_WORKFLOW, REPORT_PRIORITIES,
  type ReportStatus, type ReportPriority, type ResponderWorkload,
} from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/reports/$id")({
  head: () => ({ meta: [{ title: "Case — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ReportDetail,
});

const PRIORITY_STYLES: Record<ReportPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  normal: "bg-sky-50 text-sky-700 border-sky-200",
  high: "bg-amber-50 text-amber-800 border-amber-300",
  critical: "bg-red-50 text-red-800 border-red-300",
};

function ReportDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const canManage = user?.role === "super_admin" || user?.role === "admin" || user?.role === "gbv_officer";

  const reportQ = useQuery({
    queryKey: ["report", id],
    queryFn: () => reports.get(id),
    refetchInterval: 30_000,
  });
  const respondersQ = useQuery({
    queryKey: ["responders", "workload"],
    queryFn: () => responders.list(),
    enabled: canManage,
  });
  const attachmentsQ = useQuery({
    queryKey: ["report", id, "attachments"],
    queryFn: () => reports.listAttachments(id),
  });
  const actionsQ = useQuery({
    queryKey: ["report", id, "action-reports"],
    queryFn: () => reports.listActionReports(id),
  });

  const [note, setNote] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  const setStatus = useMutation({
    mutationFn: (s: ReportStatus) => reports.setStatus(id, s),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["report", id] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const setPriority = useMutation({
    mutationFn: (p: ReportPriority) => reports.setPriority(id, p),
    onSuccess: () => { toast.success("Priority updated"); qc.invalidateQueries({ queryKey: ["report", id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const assign = useMutation({
    mutationFn: (rid: string) => reports.assign(id, rid),
    onSuccess: () => { toast.success("Responder assigned & notified"); setAssignOpen(false); qc.invalidateQueries({ queryKey: ["report", id] }); qc.invalidateQueries({ queryKey: ["responders"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const autoAssign = useMutation({
    mutationFn: () => reports.autoAssign(id),
    onSuccess: () => { toast.success("Auto-assigned to best-matched responder"); qc.invalidateQueries({ queryKey: ["report", id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const addNote = useMutation({
    mutationFn: (body: string) => reports.addNote(id, body),
    onSuccess: () => { toast.success("Note added"); setNote(""); qc.invalidateQueries({ queryKey: ["report", id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const uploadFile = useMutation({
    mutationFn: (file: File) => reports.upload(id, file),
    onSuccess: () => { toast.success("File uploaded"); qc.invalidateQueries({ queryKey: ["report", id, "attachments"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (reportQ.isLoading) return <DashboardShell title="Case"><p className="text-sm text-muted-foreground">Loading…</p></DashboardShell>;
  if (reportQ.error || !reportQ.data) return <DashboardShell title="Case"><p className="text-sm text-destructive">{apiErrorMessage(reportQ.error) || "Not found"}</p></DashboardShell>;
  const r = reportQ.data;
  const priority = r.priority ?? "normal";
  const attachments = attachmentsQ.data ?? [];
  const actionReports = actionsQ.data ?? [];

  return (
    <DashboardShell title={`Case ${r.id.slice(0, 8).toUpperCase()}`}>
      <Link to="/admin/reports" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to cases
      </Link>

      {/* Header banner */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{r.category}</h2>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
                {priority === "critical" && <AlertTriangle className="mr-1 h-3 w-3" />}
                {priority.toUpperCase()} priority
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{r.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reported {new Date(r.created_at).toLocaleString()} · {r.province ?? "—"} / {r.district ?? "—"}
            </p>
          </div>
        </div>

        {/* Workflow timeline */}
        <WorkflowTimeline current={r.status} history={r.history ?? []} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Incident details">
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label="Reference" value={r.id} mono />
              <Info label="Submitted" value={new Date(r.created_at).toLocaleString()} />
              <Info label="Province" value={r.province ?? "—"} />
              <Info label="District" value={r.district ?? "—"} />
              <Info label="Reporter" value={r.reporter_name ?? "Anonymous"} />
              <Info label="Contact" value={r.reporter_phone ?? "—"} />
              {r.gps_lat != null && r.gps_lng != null && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">GPS location</dt>
                  <dd className="mt-0.5 text-sm">
                    <a
                      href={`https://www.google.com/maps?q=${r.gps_lat},${r.gps_lng}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {r.gps_lat.toFixed(5)}, {r.gps_lng.toFixed(5)}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {r.description && (
              <>
                <p className="mt-5 text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{r.description}</p>
              </>
            )}
          </SectionCard>

          <SectionCard title={`Case notes${r.notes ? ` (${r.notes.length})` : ""}`}>
            <form
              onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(note.trim()); }}
              className="space-y-2 mb-4"
            >
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="Add a note about this case…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <button disabled={!note.trim() || addNote.isPending} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {addNote.isPending ? "Saving…" : "Add note"}
              </button>
            </form>
            {(!r.notes || r.notes.length === 0) && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            <ul className="space-y-2">
              {r.notes?.map((n) => (
                <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.author ?? "Staff"} · {new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Attachments">
            <input
              type="file"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile.mutate(f); }}
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90"
            />
            {(!r.attachments || r.attachments.length === 0) && <p className="mt-3 text-sm text-muted-foreground">No attachments.</p>}
            <ul className="mt-3 space-y-1 text-sm">
              {r.attachments?.map((a) => (
                <li key={a.id}>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{a.filename}</a>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Priority">
            <div className="flex flex-wrap gap-2">
              {REPORT_PRIORITIES.map((p) => (
                <button
                  key={p}
                  disabled={!canManage || setPriority.isPending || priority === p}
                  onClick={() => setPriority.mutate(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${priority === p ? PRIORITY_STYLES[p] : "border-border hover:bg-muted"} disabled:opacity-60`}
                >{p}</button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Update status">
            <div className="grid grid-cols-2 gap-2">
              {REPORT_STATUSES.map((s) => (
                <button
                  key={s} disabled={!canManage || setStatus.isPending || r.status === s}
                  onClick={() => setStatus.mutate(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border ${r.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"} disabled:opacity-60`}
                >{s.replace(/_/g, " ")}</button>
              ))}
            </div>
          </SectionCard>

          {canManage && (
            <SectionCard title="Assign responder">
              <form onSubmit={(e) => { e.preventDefault(); if (assignTo) assign.mutate(assignTo); }} className="space-y-2">
                <select
                  value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Recommended first…</option>
                  {recommended.map((u) => {
                    const match = u.district === r.district ? " · same district"
                      : u.province === r.province ? " · same province" : "";
                    return (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}{match}
                      </option>
                    );
                  })}
                </select>
                <div className="flex gap-2">
                  <button disabled={!assignTo || assign.isPending} className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                    {assign.isPending ? "Assigning…" : "Assign"}
                  </button>
                  <button type="button" disabled={autoAssign.isPending}
                    onClick={() => autoAssign.mutate()}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
                    {autoAssign.isPending ? "…" : "Auto-assign"}
                  </button>
                </div>

              </form>
              {r.assigned_to && <p className="mt-2 text-xs text-muted-foreground">Currently assigned to: {r.assigned_to}</p>}
            </SectionCard>
          )}

          <SectionCard title="Audit history">
            {(!r.history || r.history.length === 0) && <p className="text-sm text-muted-foreground">No history yet.</p>}
            <ol className="space-y-3">
              {r.history?.map((h) => (
                <li key={h.id} className="text-sm">
                  <p className="font-medium">{h.action}</p>
                  <p className="text-xs text-muted-foreground">{h.actor ?? "System"} · {new Date(h.created_at).toLocaleString()}</p>
                  {h.details && <p className="mt-1 text-xs text-muted-foreground">{h.details}</p>}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}

function WorkflowTimeline({ current, history }: { current: ReportStatus; history: { action: string }[] }) {
  const reached = new Set<string>();
  for (const h of history) {
    const m = h.action.match(/^status:(.+)$/);
    if (m) reached.add(m[1]);
  }
  reached.add(current);
  const currentIdx = REPORT_WORKFLOW.indexOf(current);
  return (
    <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs">
      {REPORT_WORKFLOW.map((s, i) => {
        const done = reached.has(s) || (currentIdx >= 0 && i < currentIdx);
        const active = s === current;
        return (
          <li key={s} className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              active ? "border-primary bg-primary text-primary-foreground"
              : done ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-border text-muted-foreground"
            }`}>
              {done && !active ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {s.replace(/_/g, " ")}
            </span>
            {i < REPORT_WORKFLOW.length - 1 && <span className="text-muted-foreground">›</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</dd>
    </div>
  );
}
