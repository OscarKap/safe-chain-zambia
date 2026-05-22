import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Phone, Search, Accessibility, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { clinics } from "@/data/clinics";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Find a Clinic — Safe Chain" }, { name: "description", content: "Search youth-friendly, accessible SRHR clinics and services across Zambia." }] }),
  component: Services,
});

function Services() {
  const [q, setQ] = useState("");
  const [youthOnly, setYouthOnly] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [service, setService] = useState<string>("all");

  const allServices = useMemo(() => Array.from(new Set(clinics.flatMap(c => c.services))).sort(), []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clinics.filter(c =>
      (!term || c.name.toLowerCase().includes(term) || c.district.toLowerCase().includes(term) || c.address.toLowerCase().includes(term)) &&
      (!youthOnly || c.youthFriendly) &&
      (!accessibleOnly || c.accessible) &&
      (service === "all" || c.services.includes(service))
    );
  }, [q, youthOnly, accessibleOnly, service]);

  return (
    <>
      <PageHeader
        eyebrow="Service directory"
        title="Find youth-friendly clinics near you"
        description="Free, confidential SRHR services across Zambia. Filter by accessibility, youth-friendliness, and the support you need."
      />

      <section className="container-page py-10">
        <div className="card-soft p-4 md:p-5 grid gap-3 md:grid-cols-[1fr_220px_auto] items-end">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Search</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="District, clinic, or area" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Service</span>
            <select value={service} onChange={(e) => setService(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All services</option>
              {allServices.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setYouthOnly(v => !v)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${youthOnly ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted"}`}>Youth-friendly</button>
            <button onClick={() => setAccessibleOnly(v => !v)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${accessibleOnly ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted"}`}>Accessible</button>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">{results.length} {results.length === 1 ? "clinic" : "clinics"} found</p>

        {results.length === 0 ? (
          <div className="card-soft mt-4 p-10 text-center">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">No clinics match your filters</p>
            <p className="text-sm text-muted-foreground">Try a different district or remove a filter.</p>
          </div>
        ) : (
          <ul className="mt-4 grid md:grid-cols-2 gap-4">
            {results.map((c) => (
              <li key={c.id} className="card-soft p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><MapPin className="h-3.5 w-3.5" /> {c.address} · {c.distance}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft text-brand text-xs font-medium px-2.5 py-1 whitespace-nowrap">{c.district}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.services.map(s => <span key={s} className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-1">{s}</span>)}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  {c.youthFriendly && <span className="inline-flex items-center gap-1 text-brand"><Sparkles className="h-3.5 w-3.5" /> Youth-friendly</span>}
                  {c.accessible && <span className="inline-flex items-center gap-1 text-brand"><Accessibility className="h-3.5 w-3.5" /> Wheelchair accessible</span>}
                </div>
                <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <Phone className="h-4 w-4" /> Call {c.phone}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
