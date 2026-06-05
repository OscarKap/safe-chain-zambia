import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { submitAdminRequest, ROLES } from "@/lib/admin.functions";

const ZAMBIA_PROVINCES = [
  "Central", "Copperbelt", "Eastern", "Luapula", "Lusaka",
  "Muchinga", "Northern", "North-Western", "Southern", "Western",
];

const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  super_admin: "Super Admin",
  gbv_responder: "GBV Responder",
  clinic_admin: "Clinic Admin",
  community_volunteer: "Community Volunteer",
  counsellor: "Counsellor",
  data_reviewer: "Data Reviewer",
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Request Admin Access — Safe Chain" },
      { name: "description", content: "Approved organisations and responders can request a Safe Chain admin account. Submissions are reviewed manually." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRequestPage,
});

function AdminRequestPage() {
  const submit = useServerFn(submitAdminRequest);
  const [done, setDone] = useState(false);
  type Payload = {
    full_name: string; job_title: string; organisation: string;
    province: string; district: string; phone: string; email: string;
    reason: string; requested_role: (typeof ROLES)[number]; confirm_accurate: true;
  };
  const mut = useMutation({
    mutationFn: (data: Payload) => submit({ data }),
    onSuccess: (res) => {
      if (res.ok) { setDone(true); toast.success("Request submitted"); }
      else toast.error(res.error);
    },
    onError: (e: Error) => toast.error(e.message || "Submission failed"),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    mut.mutate({
      full_name: String(f.get("full_name") ?? ""),
      job_title: String(f.get("job_title") ?? ""),
      organisation: String(f.get("organisation") ?? ""),
      province: String(f.get("province") ?? ""),
      district: String(f.get("district") ?? ""),
      phone: String(f.get("phone") ?? ""),
      email: String(f.get("email") ?? ""),
      reason: String(f.get("reason") ?? ""),
      requested_role: String(f.get("requested_role") ?? "") as (typeof ROLES)[number],
      confirm_accurate: f.get("confirm_accurate") === "on" ? true : (false as unknown as true),
    });
  }

  if (done) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="card-soft max-w-lg w-full p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
          <h1 className="mt-4 text-2xl font-bold">Request received</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your application has been logged. Safe Chain administrators will
            review and contact you by email if approved. This usually takes
            1–3 business days.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10 md:py-14">
      <div className="container-narrow max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Request Admin Access</h1>
            <p className="text-sm text-muted-foreground">For approved responders, clinics, and partner staff only.</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>This is not a public sign-up. All submissions are manually reviewed by the Safe Chain owner. You will receive a secure invitation email if your request is approved.</p>
        </div>

        <form onSubmit={onSubmit} className="card-soft mt-6 p-6 md:p-8 space-y-5">
          <Grid>
            <Field label="Full name" name="full_name" required />
            <Field label="Job title / role" name="job_title" required />
          </Grid>
          <Field label="Organisation" name="organisation" required />
          <Grid>
            <SelectField label="Province" name="province" required options={ZAMBIA_PROVINCES} />
            <Field label="District" name="district" required />
          </Grid>
          <Grid>
            <Field label="Phone number" name="phone" type="tel" required placeholder="+260…" />
            <Field label="Email address" name="email" type="email" required />
          </Grid>
          <SelectField
            label="Type of access requested"
            name="requested_role"
            required
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
          <div className="grid gap-1.5 text-sm">
            <label htmlFor="reason" className="font-medium">Reason for requesting access</label>
            <textarea
              id="reason" name="reason" required minLength={10} maxLength={5000} rows={5}
              className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              placeholder="Briefly describe your role, the population you serve, and why you need access."
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirm_accurate" required className="mt-1 accent-[color:var(--brand)]" />
            <span>I confirm that the information provided is accurate, and I understand that misuse of Safe Chain admin tools will result in immediate revocation and may be reported.</span>
          </label>
          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {mut.isPending ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({ label, name, type = "text", required, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input
        name={name} type={type} required={required} placeholder={placeholder}
        className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({ label, name, required, options }: {
  label: string; name: string; required?: boolean;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <select
        name={name} required={required} defaultValue=""
        className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
