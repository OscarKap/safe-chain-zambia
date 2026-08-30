import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Database, Download, Play, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import { useReauthGate } from "@/components/ReauthDialog";
import {
  exportAuditLogsFn, getRetentionFn, listAuditLogsFn, runRetentionPurgeFn, updateRetentionFn,
} from "@/lib/security.functions";
import { apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/retention")({
  head: () => ({
    meta: [
      { title: "Data retention — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RetentionPage,
});

interface Settings {
  audit_log_days: number;
  attachment_days: number;
  notification_days: number;
  rate_limit_days: number;
  auto_purge_enabled: boolean;
}

interface PurgeRun {
  id: string; ran_at: string; trigger_source: string; dry_run: boolean;
  deleted_audit_logs: number; deleted_attachments: number;
  deleted_notifications: number; deleted_rate_limits: number;
}

interface AuditRow {
  id: string; created_at: string; actor_email: string | null; action: string;
  target_type: string | null; target_id: string | null; ip_address: string | null;
}

const DEFAULTS: Settings = {
  audit_log_days: 365, attachment_days: 730, notification_days: 180,
  rate_limit_days: 7, auto_purge_enabled: true,
};

function RetentionPage() {
  const { ensure, dialog } = useReauthGate();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [runs, setRuns] = useState<PurgeRun[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRetentionFn();
      if (res.settings) {
        const s = res.settings as unknown as Settings;
        setSettings({
          audit_log_days: s.audit_log_days, attachment_days: s.attachment_days,
          notification_days: s.notification_days, rate_limit_days: s.rate_limit_days,
          auto_purge_enabled: s.auto_purge_enabled,
        });
      }
      setRuns(res.runs as unknown as PurgeRun[]);
      const l = await listAuditLogsFn({ data: { limit: 50 } });
      setLogs(l.rows as unknown as AuditRow[]);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!(await ensure())) return;
    setBusy(true);
    try {
      await updateRetentionFn({ data: settings });
      toast.success("Retention settings saved");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setBusy(false); }
  }

  async function purge(dryRun: boolean) {
    if (!dryRun && !(await ensure())) return;
    setBusy(true);
    try {
      const res = await runRetentionPurgeFn({ data: { dryRun } });
      toast.success(
        `${dryRun ? "Preview" : "Purged"}: ${res.audit_logs} audit logs, ${res.attachments} attachments, ${res.notifications} notifications`,
      );
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setBusy(false); }
  }

  async function exportCsv() {
    setBusy(true);
    try {
      const res = await exportAuditLogsFn({ data: { days: settings.audit_log_days } });
      const rows = res.rows as unknown as Record<string, unknown>[];
      const headers = ["created_at", "actor_email", "actor_user_id", "action", "target_type", "target_id", "ip_address"];
      const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `safechain-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setBusy(false); }
  }

  if (loading) return <div className="container-page py-10 text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="container-page py-10 text-sm text-destructive">{error}</div>;

  const fields: { key: keyof Settings; label: string; hint: string }[] = [
    { key: "audit_log_days", label: "Audit logs (days)", hint: "30–3650" },
    { key: "attachment_days", label: "Case attachments (days)", hint: "30–3650" },
    { key: "notification_days", label: "Notifications (days)", hint: "7–3650" },
    { key: "rate_limit_days", label: "Rate-limit records (days)", hint: "1–365" },
  ];

  return (
    <div className="container-page py-8 space-y-6">
      {dialog}
      <PageHeader title="Data retention" description="Retention windows, purge history and audit log export. Super Admins only." />

      <div className="card-soft p-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-brand" />
          <h2 className="font-semibold">Retention windows</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key} type="number" value={settings[f.key] as number}
                onChange={(e) => setSettings((s) => ({ ...s, [f.key]: Number(e.target.value) }))}
              />
              <span className="text-xs text-muted-foreground">{f.hint}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Switch
            id="auto" checked={settings.auto_purge_enabled}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, auto_purge_enabled: v }))}
          />
          <Label htmlFor="auto">Run the scheduled purge automatically</Label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={save} disabled={busy}><Save className="h-4 w-4 mr-2" /> Save settings</Button>
          <Button variant="outline" onClick={() => purge(true)} disabled={busy}>
            <Play className="h-4 w-4 mr-2" /> Preview purge
          </Button>
          <Button variant="destructive" onClick={() => purge(false)} disabled={busy}>
            <Trash2 className="h-4 w-4 mr-2" /> Run purge now
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={busy}>
            <Download className="h-4 w-4 mr-2" /> Export audit logs (CSV)
          </Button>
        </div>
      </div>

      <div className="card-soft p-6">
        <h2 className="font-semibold">Purge history</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No purge has run yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">When</th><th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Mode</th><th className="py-2 pr-4">Logs</th>
                  <th className="py-2 pr-4">Attachments</th><th className="py-2 pr-4">Notifications</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 pr-4">{new Date(r.ran_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{r.trigger_source}</td>
                    <td className="py-2 pr-4">{r.dry_run ? "preview" : "purge"}</td>
                    <td className="py-2 pr-4">{r.deleted_audit_logs}</td>
                    <td className="py-2 pr-4">{r.deleted_attachments}</td>
                    <td className="py-2 pr-4">{r.deleted_notifications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-soft p-6">
        <h2 className="font-semibold">Recent audit activity</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">When</th><th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Target</th>
                <th className="py-2 pr-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="py-2 pr-4">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{l.actor_email ?? "—"}</td>
                  <td className="py-2 pr-4">{l.action}</td>
                  <td className="py-2 pr-4">{l.target_type ?? "—"} {l.target_id?.slice(0, 8) ?? ""}</td>
                  <td className="py-2 pr-4">{l.ip_address ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
