import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { analytics, reports as reportsApi } from "@/lib/api";
import { DashboardShell, StatCard, SectionCard } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Analytics,
});

function Analytics() {
  const [from, setFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const range = useMemo(() => ({
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
  }), [from, to]);

  const dataQ = useQuery({
    queryKey: ["analytics", range], queryFn: () => analytics.overview(range),
  });
  const reportsQ = useQuery({
    queryKey: ["reports", "all-for-export"], queryFn: () => reportsApi.list(),
  });

  const data = dataQ.data;

  async function exportCSV() {
    const rows = reportsQ.data ?? [];
    const csv = analytics.toCSV(rows);
    analytics.downloadCSV(`safechain-reports-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <DashboardShell title="Analytics & Reporting">
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <label className="text-sm grid gap-1">
          <span className="text-muted-foreground">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2" />
        </label>
        <label className="text-sm grid gap-1">
          <span className="text-muted-foreground">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2" />
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <FileSpreadsheet className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      {dataQ.isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Total reports" value={data.totalReports} />
            <StatCard label="Categories" value={data.byCategory.length} />
            <StatCard label="Provinces" value={data.byProvince.length} />
            <StatCard label="Avg resolution (hrs)" value={data.avgResolutionHours != null ? data.avgResolutionHours.toFixed(1) : "—"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="By status"><BarList items={data.byStatus} /></SectionCard>
            <SectionCard title="By priority"><BarList items={data.byPriority} /></SectionCard>
            <SectionCard title="By category"><BarList items={data.byCategory} /></SectionCard>
            <SectionCard title="By province"><BarList items={data.byProvince} /></SectionCard>
            <SectionCard title="Reports per day" >
              <Sparkline items={data.byDay} />
            </SectionCard>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function BarList({ items }: { items: { key: string; count: number }[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No data.</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.key} className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="capitalize">{i.key}</span>
            <span className="text-muted-foreground">{i.count}</span>
          </div>
          <div className="h-2 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Sparkline({ items }: { items: { key: string; count: number }[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No data.</p>;
  const w = 600, h = 120, pad = 10;
  const max = Math.max(...items.map((i) => i.count), 1);
  const stepX = items.length > 1 ? (w - pad * 2) / (items.length - 1) : 0;
  const points = items.map((it, idx) => {
    const x = pad + idx * stepX;
    const y = h - pad - (it.count / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" points={points} />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{items[0].key}</span><span>{items[items.length - 1].key}</span>
      </div>
    </div>
  );
}
