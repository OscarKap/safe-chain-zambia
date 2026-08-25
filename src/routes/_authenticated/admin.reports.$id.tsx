import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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

  useEffect(() => { void reports.logView(id); }, [id]);

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

          <SectionCard title={`Attachments (${attachments.length})`}>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile.mutate(f); }}
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90"
            />
            {attachments.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No attachments.</p>}
            <ul className="mt-3 space-y-1 text-sm">
              {attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{a.filename}</a>
                  {a.uploaded_at && <span className="ml-2 text-xs text-muted-foreground">{new Date(a.uploaded_at).toLocaleString()}</span>}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={`Action reports (${actionReports.length})`}>
            {actionReports.length === 0 && <p className="text-sm text-muted-foreground">No action reports submitted yet.</p>}
            <ul className="space-y-3">
              {actionReports.map((ar) => (
                <li key={ar.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Outcome</p>
                  <p className="font-medium">{ar.outcome}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                  <p className="whitespace-pre-wrap">{ar.summary}</p>
                  {ar.recommendations && <>
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Recommendations</p>
                    <p className="whitespace-pre-wrap">{ar.recommendations}</p>
                  </>}
                  <p className="mt-2 text-xs text-muted-foreground">Submitted {new Date(ar.created_at).toLocaleString()}</p>
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
            <SectionCard title="Assignment">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setAssignOpen(true)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {r.assigned_to ? "Reassign case" : "Assign case"}
                </button>
                <button
                  disabled={autoAssign.isPending}
                  onClick={() => autoAssign.mutate()}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                >
                  {autoAssign.isPending ? "Working…" : "Auto-assign (best match)"}
                </button>
              </div>
              {r.assigned_to && <p className="mt-3 text-xs text-muted-foreground">Currently assigned to <span className="font-mono">{r.assigned_to.slice(0,8)}…</span></p>}
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

      {assignOpen && (
        <AssignDialog
          reportDistrict={r.district ?? undefined}
          reportProvince={r.province ?? undefined}
          responders={respondersQ.data ?? []}
          currentAssignee={r.assigned_to ?? undefined}
          pending={assign.isPending}
          onClose={() => setAssignOpen(false)}
          onAssign={(rid) => assign.mutate(rid)}
        />
      )}
    </DashboardShell>
  );
}

function AssignDialog({
  reportDistrict, reportProvince, responders: pool, currentAssignee, pending, onClose, onAssign,
}: {
  reportDistrict?: string; reportProvince?: string;
  responders: ResponderWorkload[]; currentAssignee?: string;
  pending: boolean; onClose: () => void; onAssign: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inDistrict = pool.filter((u) => reportDistrict && u.district === reportDistrict);
    const primary = inDistrict.length > 0
      ? inDistrict
      : pool.filter((u) => reportProvince && u.province === reportProvince);
    const list = (primary.length > 0 ? primary : pool)
      .filter((u) => u.is_available)
      .filter((u) => !q || [u.first_name, u.last_name, u.email, u.specialization, u.district, u.province]
        .filter(Boolean).join(" ").toLowerCase().includes(q))
      .slice().sort((a, b) => a.open_cases - b.open_cases);
    return list;
  }, [pool, query, reportDistrict, reportProvince]);

  const scopeLabel = filtered === pool ? "all responders"
    : reportDistrict && pool.some((u) => u.district === reportDistrict) ? `district: ${reportDistrict}`
    : reportProvince ? `province: ${reportProvince}` : "all responders";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-card shadow-xl border border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold">Assign case</h3>
            <p className="text-xs text-muted-foreground">Approved & available responders · scope: {scopeLabel}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 border-b border-border">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, specialization…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-border">
          {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">No available responders match.</p>}
          {filtered.map((u) => {
            const isCurrent = currentAssignee === u.user_id;
            const load = u.max_active_cases > 0 ? u.open_cases / u.max_active_cases : 0;
            return (
              <div key={u.user_id} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <span className="text-xs rounded-full bg-muted px-2 py-0.5">Responder</span>
                    {u.specialization && <span className="text-xs rounded-full bg-sky-50 text-sky-700 px-2 py-0.5">{u.specialization}</span>}
                    {u.district === reportDistrict && <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">same district</span>}
                    {u.district !== reportDistrict && u.province === reportProvince && <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-2 py-0.5">same province</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{u.district ?? "—"}, {u.province ?? "—"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                    {u.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phone}</span>}
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded overflow-hidden w-40">
                      <div className={`h-full ${load >= 1 ? "bg-red-500" : load > 0.7 ? "bg-orange-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, load * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">Workload {u.open_cases}/{u.max_active_cases}</p>
                  </div>
                </div>
                <button
                  disabled={pending || isCurrent || u.open_cases >= u.max_active_cases}
                  onClick={() => onAssign(u.user_id)}
                  className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isCurrent ? "Currently assigned" : u.open_cases >= u.max_active_cases ? "At capacity" : pending ? "…" : "Assign"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
