import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reports, notifications, dashboard, apiErrorMessage, API_BASE_URL } from "@/lib/api";
import { DashboardShell, SectionCard, StatCard } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/developer/dashboard")({
  head: () => ({ meta: [{ title: "Developer dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DeveloperDashboard,
});

function DeveloperDashboard() {
  const { user } = useAuth();
  const reportsQ = useQuery({ queryKey: ["reports", "dev"], queryFn: () => reports.list(), enabled: !!user });
  const notifQ = useQuery({ queryKey: ["notifications"], queryFn: notifications.list, enabled: !!user });
  const statsQ = useQuery({ queryKey: ["dashboard", "dev"], queryFn: () => dashboard.admin(), enabled: !!user, retry: 1 });

  return (
    <DashboardShell title="Developer Dashboard">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Reports" value={reportsQ.data?.length ?? 0} />
        <StatCard label="Notifications" value={notifQ.data?.length ?? 0} />
        <StatCard label="API base" value={API_BASE_URL.replace(/^https?:\/\//, "")} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="System checks">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>/dashboard/admin</span><span className={statsQ.error ? "text-destructive" : "text-emerald-600"}>{statsQ.error ? "Error" : statsQ.isLoading ? "…" : "OK"}</span></li>
            <li className="flex justify-between"><span>/reports</span><span className={reportsQ.error ? "text-destructive" : "text-emerald-600"}>{reportsQ.error ? "Error" : reportsQ.isLoading ? "…" : "OK"}</span></li>
            <li className="flex justify-between"><span>/notifications</span><span className={notifQ.error ? "text-destructive" : "text-emerald-600"}>{notifQ.error ? "Error" : notifQ.isLoading ? "…" : "OK"}</span></li>
          </ul>
          {(statsQ.error || reportsQ.error || notifQ.error) && (
            <p className="mt-3 text-xs text-destructive">{apiErrorMessage(statsQ.error || reportsQ.error || notifQ.error)}</p>
          )}
        </SectionCard>
        <SectionCard title="Recent reports (raw)">
          <pre className="text-xs overflow-auto max-h-80 bg-muted/40 p-3 rounded-lg">{JSON.stringify(reportsQ.data?.slice(0, 5) ?? [], null, 2)}</pre>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
