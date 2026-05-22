import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BookOpen, Bell, FileText, MapPin, MessageSquareWarning, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Safe Chain" }] }),
  component: Dashboard,
});

const kpis = [
  { label: "Open reports", value: 2, icon: FileText, tone: "brand" },
  { label: "Saved resources", value: 7, icon: BookOpen, tone: "warm" },
  { label: "Nearby clinics", value: 4, icon: MapPin, tone: "brand" },
  { label: "Community responses", value: 12, icon: TrendingUp, tone: "warm" },
];

const activity = [
  { ref: "SC-9F2K1A", category: "Service complaint", district: "Lusaka", status: "Under review", when: "2 days ago" },
  { ref: "SC-7H1B3D", category: "GBV", district: "Kitwe", status: "Referred to one-stop centre", when: "1 week ago" },
];

function Dashboard() {
  return (
    <>
      <PageHeader eyebrow="Welcome back" title="Your Safe Chain" description="A private space to follow your reports, saved resources, and nearby services." />

      <section className="container-page py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="card-soft p-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${k.tone === "brand" ? "bg-brand-soft text-brand" : "bg-warm/15 text-warm"}`}>
              <k.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-bold">{k.value}</p>
            <p className="text-sm text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="container-page pb-16 grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-soft p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-brand" /> Recent reports</h2>
            <Link to="/report" className="text-sm font-medium text-brand">New report</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2 pr-3 font-medium">Ref</th><th className="py-2 pr-3 font-medium">Category</th><th className="py-2 pr-3 font-medium">District</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 font-medium">When</th></tr>
              </thead>
              <tbody>
                {activity.map(r => (
                  <tr key={r.ref} className="border-t border-border">
                    <td className="py-3 pr-3 font-mono">{r.ref}</td>
                    <td className="py-3 pr-3">{r.category}</td>
                    <td className="py-3 pr-3">{r.district}</td>
                    <td className="py-3 pr-3"><span className="rounded-full bg-brand-soft text-brand px-2.5 py-1 text-xs font-medium">{r.status}</span></td>
                    <td className="py-3 text-muted-foreground">{r.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-soft p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-brand" /> Notifications</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand" /><div><p>Lusaka Youth Health Center responded to your feedback.</p><p className="text-xs text-muted-foreground">Yesterday</p></div></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-warm" /><div><p>New lesson available: <strong>Consent & boundaries</strong>.</p><p className="text-xs text-muted-foreground">3 days ago</p></div></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/40" /><div><p>Your district scorecard improved by 0.2 stars.</p><p className="text-xs text-muted-foreground">1 week ago</p></div></li>
          </ul>
        </div>

        <div className="lg:col-span-3 card-soft p-6">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/report" className="rounded-xl border border-border p-4 hover:bg-muted transition"><MessageSquareWarning className="h-5 w-5 text-brand" /><p className="mt-2 font-medium">File a report</p></Link>
            <Link to="/services" className="rounded-xl border border-border p-4 hover:bg-muted transition"><MapPin className="h-5 w-5 text-brand" /><p className="mt-2 font-medium">Find a clinic</p></Link>
            <Link to="/learn" className="rounded-xl border border-border p-4 hover:bg-muted transition"><BookOpen className="h-5 w-5 text-brand" /><p className="mt-2 font-medium">Open hub</p></Link>
            <Link to="/feedback" className="rounded-xl border border-border p-4 hover:bg-muted transition"><TrendingUp className="h-5 w-5 text-brand" /><p className="mt-2 font-medium">Rate a service</p></Link>
          </div>
        </div>
      </section>
    </>
  );
}
