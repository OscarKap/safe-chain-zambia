import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck, Users, ClipboardList, ScrollText, LogOut,
  CheckCircle2, XCircle, PauseCircle, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyAdminContext, listAdminRequests, approveRequest, updateRequestStatus,
  listAdmins, listActivity,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin-console")({
  head: () => ({ meta: [{ title: "Admin Console — Safe Chain" }, { name: "robots", content: "noindex" }] }),
  component: AdminConsole,
});

type Tab = "requests" | "admins" | "activity";

function AdminConsole() {
  const navigate = useNavigate();
  const getCtx = useServerFn(getMyAdminContext);
  const { data: ctx, isLoading } = useQuery({ queryKey: ["admin-ctx"], queryFn: () => getCtx() });
  const [tab, setTab] = useState<Tab>("requests");

  if (isLoading) return <Centered>Loading…</Centered>;
  if (!ctx) return <Centered>Could not load admin context.</Centered>;

  // First-login gate
  if (ctx.profile?.must_change_password) {
    return (
      <Centered>
        <div className="card-soft p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold">Finish setting up your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Please change your password before using the console.</p>
          <Link to="/account/setup" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Continue</Link>
        </div>
      </Centered>
    );
  }

  const isSuper = ctx.roles.includes("super_admin");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <section className="px-4 py-8 md:py-12">
      <div className="container-narrow max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">Admin Console</h1>
              <p className="text-xs text-muted-foreground">
                {ctx.email} · {ctx.roles.join(", ") || "no roles"}
              </p>
            </div>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>

        {!isSuper ? (
          <div className="card-soft mt-8 p-6">
            <h2 className="text-lg font-semibold">Welcome</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your assigned roles: <strong>{ctx.roles.join(", ") || "none"}</strong>.
              Additional admin tools will appear here as they are released.
            </p>
          </div>
        ) : (
          <>
            <nav className="mt-6 flex flex-wrap gap-2 border-b border-border">
              <TabBtn active={tab === "requests"} onClick={() => setTab("requests")} icon={<ClipboardList className="h-4 w-4" />}>Requests</TabBtn>
              <TabBtn active={tab === "admins"} onClick={() => setTab("admins")} icon={<Users className="h-4 w-4" />}>Admins</TabBtn>
              <TabBtn active={tab === "activity"} onClick={() => setTab("activity")} icon={<ScrollText className="h-4 w-4" />}>Activity</TabBtn>
            </nav>
            <div className="mt-6">
              {tab === "requests" && <RequestsTab />}
              {tab === "admins" && <AdminsTab />}
              {tab === "activity" && <ActivityTab />}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {icon}{children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <section className="min-h-[60vh] flex items-center justify-center px-4 py-12">{children}</section>;
}

// ----- Requests -----
function RequestsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listAdminRequests);
  const approve = useServerFn(approveRequest);
  const updateStatus = useServerFn(updateRequestStatus);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "suspended" | "all">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-requests", statusFilter],
    queryFn: () => list({ data: { status: statusFilter } }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => { toast.success("Approved & invited"); qc.invalidateQueries({ queryKey: ["admin-requests"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (v: { id: string; status: "rejected" | "suspended" | "pending"; notes?: string }) => updateStatus({ data: v }),
    onSuccess: (_, v) => { toast.success(`Marked ${v.status}`); qc.invalidateQueries({ queryKey: ["admin-requests"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "rejected", "suspended", "all"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (data?.rows.length ?? 0) === 0 && (
          <div className="card-soft p-6 text-center text-sm text-muted-foreground">No requests in this view.</div>
        )}
        {data?.rows.map((r) => (
          <RequestCard key={r.id} r={r}
            onApprove={() => approveMut.mutate(r.id)}
            onReject={() => updateMut.mutate({ id: r.id, status: "rejected" })}
            onSuspend={() => updateMut.mutate({ id: r.id, status: "suspended" })}
            busy={approveMut.isPending || updateMut.isPending}
          />
        ))}
      </div>
    </div>
  );
}

type Req = {
  id: string; full_name: string; email: string; phone: string;
  organisation: string; job_title: string; province: string; district: string;
  reason: string; requested_role: string; status: string; created_at: string;
  review_notes: string | null; reviewed_at: string | null;
};

function RequestCard({ r, onApprove, onReject, onSuspend, busy }: {
  r: Req; onApprove: () => void; onReject: () => void; onSuspend: () => void; busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{r.full_name} <span className="text-muted-foreground font-normal">· {r.job_title}</span></h3>
          <p className="text-xs text-muted-foreground">{r.organisation} · {r.district}, {r.province}</p>
          <p className="mt-1 text-xs">
            <a href={`mailto:${r.email}`} className="text-brand">{r.email}</a> · {r.phone}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusPill status={r.status} />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">{r.requested_role.replace("_", " ")}</span>
        </div>
      </div>

      <button onClick={() => setOpen((o) => !o)} className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} /> {open ? "Hide" : "Show"} reason
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{r.reason}</div>
      )}

      {r.status === "pending" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionBtn onClick={onApprove} disabled={busy} variant="primary" icon={<CheckCircle2 className="h-4 w-4" />}>Approve & invite</ActionBtn>
          <ActionBtn onClick={onReject} disabled={busy} variant="danger" icon={<XCircle className="h-4 w-4" />}>Reject</ActionBtn>
          <ActionBtn onClick={onSuspend} disabled={busy} variant="muted" icon={<PauseCircle className="h-4 w-4" />}>Suspend</ActionBtn>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200",
    approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
    suspended: "bg-zinc-200 text-zinc-900 dark:bg-zinc-500/20 dark:text-zinc-100",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

function ActionBtn({ children, icon, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode; variant: "primary" | "danger" | "muted" }) {
  const cls =
    variant === "primary" ? "bg-primary text-primary-foreground hover:opacity-90" :
    variant === "danger" ? "bg-destructive text-destructive-foreground hover:opacity-90" :
    "border border-border hover:bg-muted";
  return (
    <button {...props} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60 ${cls}`}>
      {icon}{children}
    </button>
  );
}

// ----- Admins -----
function AdminsTab() {
  const list = useServerFn(listAdmins);
  const { data, isLoading } = useQuery({ queryKey: ["admins"], queryFn: () => list() });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const rolesByUser = new Map<string, string[]>();
  data?.roles.forEach((r) => {
    const arr = rolesByUser.get(r.user_id) ?? []; arr.push(r.role); rolesByUser.set(r.user_id, arr);
  });
  return (
    <div className="space-y-3">
      {(data?.profiles ?? []).map((p) => (
        <div key={p.user_id} className="card-soft p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">{p.full_name}</h3>
            <p className="text-xs text-muted-foreground">{p.organisation ?? "—"} · {p.district ?? "—"}, {p.province ?? "—"}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(rolesByUser.get(p.user_id) ?? []).map((r) => (
              <span key={r} className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">{r.replace("_", " ")}</span>
            ))}
            {p.suspended && <span className="rounded-full bg-red-100 text-red-900 px-2 py-0.5 text-[11px]">Suspended</span>}
          </div>
        </div>
      ))}
      {(data?.profiles.length ?? 0) === 0 && <div className="card-soft p-6 text-center text-sm text-muted-foreground">No admins yet.</div>}
    </div>
  );
}

// ----- Activity -----
function ActivityTab() {
  const list = useServerFn(listActivity);
  const { data, isLoading } = useQuery({ queryKey: ["activity"], queryFn: () => list() });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <div className="card-soft divide-y divide-border">
      {(data?.rows ?? []).map((row) => (
        <div key={row.id} className="p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs">{row.action}</span>
            <span className="text-[11px] text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {row.actor_email ?? "system"} {row.target_type ? `· ${row.target_type}` : ""}
          </p>
        </div>
      ))}
      {(data?.rows.length ?? 0) === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No activity yet.</p>}
    </div>
  );
}
