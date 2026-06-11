import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import {
  reports, users, apiErrorMessage, REPORT_STATUSES,
  type ReportStatus,
} from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/reports/$id")({
  head: () => ({ meta: [{ title: "Report — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const reportQ = useQuery({ queryKey: ["report", id], queryFn: () => reports.get(id) });
  const respondersQ = useQuery({
    queryKey: ["users", "responders"],
    queryFn: () => users.list({ role: "responder", status: "active" }),
    enabled: user?.role === "super_admin" || user?.role === "admin",
  });

  const [note, setNote] = useState("");
  const [assignTo, setAssignTo] = useState("");

  const setStatus = useMutation({
    mutationFn: (s: ReportStatus) => reports.setStatus(id, s),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["report", id] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const assign = useMutation({
    mutationFn: (rid: string) => reports.assign(id, rid),
    onSuccess: () => { toast.success("Responder assigned"); setAssignTo(""); qc.invalidateQueries({ queryKey: ["report", id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const addNote = useMutation({
    mutationFn: (body: string) => reports.addNote(id, body),
    onSuccess: () => { toast.success("Note added"); setNote(""); qc.invalidateQueries({ queryKey: ["report", id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const uploadFile = useMutation({
    mutationFn: (file: File) => reports.upload(id, file),
    onSuccess: () => { toast.success("File uploaded"); qc.invalidateQueries({ queryKey: ["report", id] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (reportQ.isLoading) return <DashboardShell title="Report"><p className="text-sm text-muted-foreground">Loading…</p></DashboardShell>;
  if (reportQ.error || !reportQ.data) return <DashboardShell title="Report"><p className="text-sm text-destructive">{apiErrorMessage(reportQ.error) || "Not found"}</p></DashboardShell>;
  const r = reportQ.data;

  return (
    <DashboardShell title="Report details">
      <Link to="/admin/reports" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to reports
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title={r.category} action={<span className="rounded-full bg-muted px-2 py-1 text-xs">{r.status}</span>}>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label="Reference" value={r.id} mono />
              <Info label="Submitted" value={new Date(r.created_at).toLocaleString()} />
              <Info label="Province" value={r.province ?? "—"} />
              <Info label="District" value={r.district ?? "—"} />
              <Info label="Reporter" value={r.reporter_name ?? "Anonymous"} />
              <Info label="Contact" value={r.reporter_phone ?? "—"} />
            </dl>
            {r.description && (
              <>
                <p className="mt-5 text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{r.description}</p>
              </>
            )}
          </SectionCard>

          <SectionCard title={`Notes${r.notes ? ` (${r.notes.length})` : ""}`}>
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
          <SectionCard title="Update status">
            <div className="grid grid-cols-2 gap-2">
              {REPORT_STATUSES.map((s) => (
                <button
                  key={s} disabled={setStatus.isPending || r.status === s}
                  onClick={() => setStatus.mutate(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border ${r.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"} disabled:opacity-60`}
                >{s}</button>
              ))}
            </div>
          </SectionCard>

          {(user?.role === "super_admin" || user?.role === "admin") && (
            <SectionCard title="Assign responder">
              <form onSubmit={(e) => { e.preventDefault(); if (assignTo) assign.mutate(assignTo); }} className="space-y-2">
                <select
                  value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select responder…</option>
                  {respondersQ.data?.map((u) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
                <button disabled={!assignTo || assign.isPending} className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  {assign.isPending ? "Assigning…" : "Assign"}
                </button>
              </form>
              {r.assigned_to && <p className="mt-2 text-xs text-muted-foreground">Currently assigned to: {r.assigned_to}</p>}
            </SectionCard>
          )}

          <SectionCard title="History">
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

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</dd>
    </div>
  );
}
