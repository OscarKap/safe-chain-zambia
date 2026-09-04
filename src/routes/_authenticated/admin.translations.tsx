import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Languages, RefreshCw, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { apiErrorMessage } from "@/lib/api";
import {
  LANGUAGES, LANGUAGE_ORDER, TRANSLATION_STATUSES,
  type LanguageCode, type TranslationStatus,
} from "@/lib/i18n/config";
import { listTranslationsFn, retranslateFn, reviewTranslationFn } from "@/lib/i18n/i18n.functions";

export const Route = createFileRoute("/_authenticated/admin/translations")({
  head: () => ({
    meta: [
      { title: "Translations — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TranslationsPage,
});

interface Row {
  id: string;
  translation_key: string;
  source_text: string;
  target_language: string;
  translated_text: string;
  machine_text: string | null;
  context: string | null;
  provider: string | null;
  model: string | null;
  status: string;
  human_reviewed: boolean;
  updated_at: string;
}

interface Failure {
  id: string; translation_key: string | null; target_language: string;
  provider: string | null; error: string; created_at: string;
}

function TranslationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [language, setLanguage] = useState<LanguageCode | "">("");
  const [status, setStatus] = useState<TranslationStatus | "">("");
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTranslationsFn({
        data: {
          language: language || undefined,
          status: status || undefined,
          q: q || undefined,
          limit: 100,
        },
      });
      setRows(res.rows as unknown as Row[]);
      setFailures(res.failures as unknown as Failure[]);
      setDrafts({});
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [language, status, q]);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, next: TranslationStatus) {
    setBusy(true);
    try {
      await reviewTranslationFn({ data: { id, status: next, translatedText: drafts[id] } });
      toast.success("Translation updated");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setBusy(false); }
  }

  async function retranslate(id: string) {
    setBusy(true);
    try {
      await retranslateFn({ data: { id } });
      toast.success("Retranslated");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setBusy(false); }
  }

  return (
    <div className="container-page py-8 space-y-6">
      <PageHeader
        title="Translation management"
        description="Review, edit and approve Zambian-language translations. Machine output is never authoritative until a reviewer approves it."
      />

      <div className="card-soft p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="lang">Language</label>
            <select
              id="lang" value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode | "")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All languages</option>
              {LANGUAGE_ORDER.filter((c) => c !== "en").map((c) => (
                <option key={c} value={c}>{LANGUAGES[c].name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="status">Status</label>
            <select
              id="status" value={status}
              onChange={(e) => setStatus(e.target.value as TranslationStatus | "")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {TRANSLATION_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5 flex-1 min-w-56">
            <label className="text-xs text-muted-foreground" htmlFor="q">Search source text</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" placeholder="e.g. Report" />
            </div>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading translations…</p>}
      {!loading && rows.length === 0 && (
        <div className="card-soft p-8 text-center">
          <Languages className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 font-semibold">No translations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Entries appear here as visitors browse the site in a Zambian language.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="card-soft p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-brand-soft text-brand px-2.5 py-1 font-semibold">
                {LANGUAGES[r.target_language as LanguageCode]?.name ?? r.target_language}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1">{r.status.replace(/_/g, " ")}</span>
              <span className="rounded-full bg-muted px-2.5 py-1">
                {r.human_reviewed ? "human reviewed" : "machine only"}
              </span>
              {r.provider && (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {r.provider}{r.model ? ` · ${r.model}` : ""}
                </span>
              )}
              <span className="text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</span>
            </div>

            <p className="mt-3 text-sm font-medium">{r.source_text}</p>
            {r.context && <p className="text-xs text-muted-foreground mt-0.5">Context: {r.context}</p>}

            <Textarea
              className="mt-3"
              rows={3}
              value={drafts[r.id] ?? r.translated_text}
              onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
            />
            {r.machine_text && r.machine_text !== r.translated_text && (
              <p className="mt-2 text-xs text-muted-foreground">
                Machine output kept for comparison: {r.machine_text}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => review(r.id, "approved")} disabled={busy}>
                <Save className="h-4 w-4 mr-2" /> Save &amp; approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => review(r.id, "human_reviewed")} disabled={busy}>
                Mark reviewed
              </Button>
              <Button size="sm" variant="outline" onClick={() => review(r.id, "needs_revision")} disabled={busy}>
                Needs revision
              </Button>
              <Button size="sm" variant="ghost" onClick={() => retranslate(r.id)} disabled={busy}>
                <RefreshCw className="h-4 w-4 mr-2" /> Retranslate
              </Button>
            </div>
          </div>
        ))}
      </div>

      {failures.length > 0 && (
        <div className="card-soft p-5">
          <h2 className="font-semibold">Recent translation failures</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {failures.map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-3">
                <span className="font-medium">{f.target_language}</span>
                {f.provider ? ` · ${f.provider}` : ""} — {f.error}
                <span className="block text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
