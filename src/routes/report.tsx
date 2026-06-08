import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, ShieldCheck, CheckCircle2, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PROVINCES, ZAMBIA } from "@/data/facilities";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Safe Reporting — Safe Chain" }, { name: "description", content: "Anonymously report SRHR concerns, GBV incidents and service complaints. Track your case privately." }] }),
  component: Report,
});

const categories = [
  { id: "gbv", label: "Gender-based violence" },
  { id: "assault", label: "Sexual assault" },
  { id: "service", label: "Service complaint" },
  { id: "sti", label: "STI / health concern" },
  { id: "other", label: "Other" },
];

const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  district: z.string().trim().min(2, "District is required").max(60),
  description: z.string().trim().min(20, "Please add at least 20 characters").max(2000),
  contact: z.string().trim().max(120).optional(),
});

function Report() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const districts = useMemo(() => (province ? ZAMBIA[province] ?? [] : []), [province]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!province) { toast.error("Choose a province"); return; }
    if (!district) { toast.error("Choose a district"); return; }
    const parsed = schema.safeParse({
      category: fd.get("category"),
      district: `${district}, ${province}`,
      description: fd.get("description"),
      contact: anonymous ? "" : (fd.get("contact") as string),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const ref = "SC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const reports = JSON.parse(localStorage.getItem("sc_reports") || "[]");
    reports.unshift({ ref, ...parsed.data, status: "Received", createdAt: new Date().toISOString() });
    localStorage.setItem("sc_reports", JSON.stringify(reports));
    setSubmitted(ref);
    toast.success("Report received");
  }

  if (submitted) {
    return (
      <>
        <PageHeader eyebrow="You're safe" title="Report received" description="Thank you for trusting Safe Chain. Save this reference to track your case." />
        <section className="container-page py-12">
          <div className="card-soft mx-auto max-w-xl p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
            <p className="mt-4 text-sm text-muted-foreground">Your reference number</p>
            <p className="mt-1 text-3xl font-bold tracking-wider">{submitted}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              A trained responder will review your report. If you shared contact info, we'll reach out within 48 hours.
            </p>
            <button onClick={() => setSubmitted(null)} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Submit another
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Confidential by default"
        title="Safe reporting"
        description="Tell us what happened. You don't need to share your name. We use your report to support you and to push for change."
      />
      <section className="container-page py-10 grid lg:grid-cols-3 gap-8">
        <form onSubmit={onSubmit} className="lg:col-span-2 card-soft p-6 md:p-8 space-y-6">
          <fieldset>
            <legend className="text-sm font-semibold">What kind of report?</legend>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm has-[:checked]:bg-brand-soft has-[:checked]:border-brand cursor-pointer">
                  <input type="radio" name="category" value={c.id} className="accent-[color:var(--brand)]" required />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid sm:grid-cols-3 gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Province</span>
              <div className="relative">
                <select
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setDistrict(""); }}
                  required
                  className="w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-9 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">District</span>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  disabled={!province}
                  className="w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-9 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">{province ? "Select district" : "Choose province first"}</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">When did this happen? <span className="text-muted-foreground font-normal">(optional)</span></span>
              <input name="when" type="date" className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">What happened?</span>
            <textarea name="description" required rows={6} placeholder="Share as much or as little as you feel comfortable with." className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring resize-y" />
          </label>

          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-1 accent-[color:var(--brand)]" />
              <span>
                <span className="font-medium">Keep my report fully anonymous</span>
                <span className="block text-muted-foreground">No name, phone, or device info will be stored.</span>
              </span>
            </label>
            {!anonymous && (
              <label className="mt-3 grid gap-1.5 text-sm">
                <span className="font-medium">How can we reach you? <span className="text-muted-foreground font-normal">(phone or email)</span></span>
                <input name="contact" placeholder="e.g., 0977 123 456" className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
              </label>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Submit report</button>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Encrypted locally before sending.
            </p>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card-soft p-5">
            <ShieldCheck className="h-6 w-6 text-brand" />
            <h3 className="mt-2 font-semibold">Your privacy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We never share your data with third parties. Anonymous reports cannot be traced back to you.
            </p>
          </div>
          <div className="card-soft p-5">
            <h3 className="font-semibold">In immediate danger?</h3>
            <p className="text-sm text-muted-foreground mt-1">Dial <a href="tel:991" className="font-bold text-foreground underline">991</a> or text <strong>SAFECHAIN HELP</strong> to <strong>555</strong>.</p>
          </div>
          <div className="card-soft p-5">
            <h3 className="font-semibold">No internet?</h3>
            <p className="text-sm text-muted-foreground mt-1">SMS reports work everywhere in Zambia. Standard rates apply.</p>
          </div>
        </aside>
      </section>
    </>
  );
}
