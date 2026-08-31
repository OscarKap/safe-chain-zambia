import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, CheckCircle2, ArrowLeft } from "lucide-react";
import { auth, apiErrorMessage, type Role } from "@/lib/api";
import { Field, Select, ProvinceDistrict } from "@/components/RegisterFields";
import { DEPARTMENTS, CASE_TYPES, CASE_TYPE_LABEL, caseTypesFor } from "@/data/departments";

const RESPONDER_ROLES: { value: Role; label: string }[] = [
  { value: "responder", label: "Field responder" },
  { value: "counsellor", label: "Counsellor" },
  { value: "gbv_officer", label: "GBV officer" },
];

export const Route = createFileRoute("/register/responder")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Responder Access Request — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegisterResponder;
});

function RegisterResponder() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<string>("responder");
  const [caseTypes, setCaseTypes] = useState<string[]>([]);

  const suggested = useMemo(() => caseTypesFor(department), [department]);
  useEffect(() => { setCaseTypes(suggested); }, [suggested]);

  const dept = DEPARTMENTS.find((d) => d.id === department);

  function toggle(id: string) {
    setCaseTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!department) { toast.error("Select the department you work with"); return; }
    if (caseTypes.length === 0) { toast.error("Select at least one case type you can handle"); return; }
    setLoading(true);
    try {
      await auth.register({
        first_name: String(f.get("first_name") ?? "").trim(),
        last_name: String(f.get("last_name") ?? "").trim(),
        email: String(f.get("email") ?? "").trim(),
        phone: String(f.get("phone") ?? "").trim(),
        password,
        role: role as Role,
        province, district,
        department,
        case_types: caseTypes,
        specialization: caseTypes[0],
      });
      setDone(true);
      toast.success("Responder request submitted for approval");
      setTimeout(() => navigate({ to: "/pending" }), 1500);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="card-soft max-w-lg w-full p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
          <h1 className="mt-4 text-2xl font-bold">Request submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your responder request is awaiting approval. Once approved you'll receive
            cases from your district that match the case types you handle.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10 md:py-14">
      <div className="container-narrow max-w-2xl">
        <Link to="/register" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Responder access</h1>
            <p className="text-sm text-muted-foreground">
              Police VSU, health centres, churches, mental health, counselling and community volunteers.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card-soft mt-6 p-6 md:p-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name" name="first_name" required />
            <Field label="Last name" name="last_name" required />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Email" name="email" type="email" required placeholder="you@organisation.org" />
            <Field label="Phone" name="phone" type="tel" required placeholder="+260…" />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 md:p-5 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Where you serve
            </p>
            <ProvinceDistrict
              province={province} district={district}
              onProvince={setProvince} onDistrict={setDistrict}
            />
            <Field label="Station / facility / organisation name" name="organisation" required placeholder="e.g. Kabwata Police VSU" />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 md:p-5 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What support you provide
            </p>
            <Select
              label="Department / sector" name="department" required
              value={department} onChange={setDepartment}
              placeholder="Select department…"
              options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))}
              hint={dept?.description}
            />
            <Select
              label="Position type" name="role" required value={role} onChange={setRole}
              placeholder="Select position…"
              options={RESPONDER_ROLES.map((r) => ({ value: r.value, label: r.label }))}
            />

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                Case types you can handle <span className="text-destructive">*</span>
              </legend>
              <p className="text-xs text-muted-foreground">
                {department
                  ? "Pre-selected from your department — adjust to match what you actually handle."
                  : "Select a department first to see suggestions, or tick your own."}
              </p>
              <div className="mt-1 grid sm:grid-cols-2 gap-2">
                {CASE_TYPES.map((c) => {
                  const checked = caseTypes.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer transition ${
                        checked ? "border-brand bg-brand/5" : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <input
                        type="checkbox" checked={checked} onChange={() => toggle(c.id)}
                        className="accent-[color:var(--brand)]"
                      />
                      {CASE_TYPE_LABEL[c.id]}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <Field label="Password" name="password" type="password" required placeholder="At least 8 characters" />

          <button
            type="submit" disabled={loading}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit responder request"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Need an administrator account instead?{" "}
            <Link to="/register/admin" className="text-brand font-medium">Register as an admin</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
