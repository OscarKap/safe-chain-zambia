import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Phone, Search, Building2, Stethoscope, X, ChevronDown, Navigation, Accessibility } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { facilities, PROVINCES, ZAMBIA, servicesFor, SERVICE_FILTERS, type Facility } from "@/data/facilities";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Find a Clinic — Safe Chain" },
      { name: "description", content: "Search every health facility in Zambia by province and district. Find clinics, health posts and hospitals offering SRHR, HIV and maternal services." },
    ],
  }),
  component: Services,
});

function Services() {
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const districts = useMemo(() => (province ? ZAMBIA[province] : []), [province]);

  const results = useMemo(() => {
    if (!province || !district) return [] as Facility[];
    const term = q.trim().toLowerCase();
    return facilities
      .filter((f) => f.province === province && f.district === district)
      .filter((f) => !term || f.name.toLowerCase().includes(term) || f.type.toLowerCase().includes(term) || f.code.includes(term))
      .filter((f) => {
        if (activeFilters.length === 0) return true;
        const s = servicesFor(f.type);
        return activeFilters.every((id) => {
          const def = SERVICE_FILTERS.find((x) => x.id === id);
          return def ? def.match(s) : true;
        });
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [province, district, q, activeFilters]);

  const toggleFilter = (id: string) =>
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const totalInDistrict = useMemo(
    () => (province && district ? facilities.filter((f) => f.province === province && f.district === district).length : 0),
    [province, district],
  );

  return (
    <>
      <PageHeader
        eyebrow="Find a clinic"
        title="Health facilities across Zambia"
        description="Pick your province and district to find every clinic, health post and hospital near you — including SRHR, HIV, maternal and emergency services."
      />

      <section className="container-page py-6 md:py-10">
        {/* Sticky search/filter bar */}
        <div className="sticky top-[64px] z-20 -mx-4 md:mx-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b md:border md:rounded-2xl md:shadow-sm px-4 md:px-5 py-4 md:py-5">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
            <FancySelect
              label="Province"
              value={province}
              placeholder="Select province"
              options={PROVINCES}
              onChange={(v) => {
                setProvince(v);
                setDistrict("");
              }}
            />
            <FancySelect
              label="District"
              value={district}
              placeholder={province ? "Select district" : "Choose province first"}
              options={districts}
              disabled={!province}
              onChange={setDistrict}
            />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Search facility</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name, type or facility code"
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-9 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                />
                {q && (
                  <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </label>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {SERVICE_FILTERS.map((f) => {
              const active = activeFilters.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFilter(f.id)}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    active ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {!province || !district ? (
            <EmptyState
              icon={<MapPin className="h-10 w-10 text-muted-foreground" />}
              title="Choose your province and district"
              hint="Start by selecting where you live. You'll see every nearby clinic, hospital and health post."
            />
          ) : results.length === 0 && totalInDistrict === 0 ? (
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
              title={`No facilities listed yet for ${district}`}
              hint="We're expanding our directory across all 10 provinces. Try a nearby district, or check back soon."
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Search className="h-10 w-10 text-muted-foreground" />}
              title="No facilities match your filters"
              hint="Try removing a service filter or clearing your search."
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.length}</span> {results.length === 1 ? "facility" : "facilities"} in {district}, {province}
                </p>
              </div>
              <ul className="grid gap-3 md:grid-cols-2">
                {results.map((f) => (
                  <FacilityCard key={f.code} facility={f} />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  const [open, setOpen] = useState(false);
  const services = servicesFor(facility.type);
  return (
    <li className="card-soft p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-brand-soft text-brand h-11 w-11 grid place-items-center shrink-0">
          {facility.type.includes("Hospital") ? <Stethoscope className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight truncate">{facility.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {facility.type} · {facility.owner} · Code {facility.code}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1 shrink-0">
          <Navigation className="h-3 w-3" /> —
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {services.slice(0, open ? services.length : 4).map((s) => (
          <span key={s} className="text-[11px] rounded-full bg-muted text-muted-foreground px-2 py-0.5">
            {s}
          </span>
        ))}
        {!open && services.length > 4 && (
          <button onClick={() => setOpen(true)} className="text-[11px] rounded-full bg-muted/60 px-2 py-0.5 text-brand font-medium">
            +{services.length - 4} more
          </button>
        )}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden text-xs font-medium text-brand inline-flex items-center gap-1 self-start"
      >
        {open ? "Hide details" : "Show details"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="text-xs text-muted-foreground border-t pt-3 grid gap-1.5">
          <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {facility.district}, {facility.province}</p>
          <p className="flex items-center gap-2"><Accessibility className="h-3.5 w-3.5" /> Accessibility info coming soon</p>
        </div>
      )}

      <div className="flex gap-2 mt-1">
        <button
          disabled
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed"
          title="Phone numbers will be published soon"
        >
          <Phone className="h-3.5 w-3.5" /> Call (soon)
        </button>
        <button
          disabled
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-input px-3 py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Navigation className="h-3.5 w-3.5" /> Directions (soon)
        </button>
      </div>
    </li>
  );
}

function FancySelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-input bg-background pl-3 pr-9 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-sm"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </label>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="card-soft p-10 text-center">
      <div className="mx-auto w-fit">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{hint}</p>
    </div>
  );
}
