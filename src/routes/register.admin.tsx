import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import { auth, ROLE_LABEL, apiErrorMessage, type Role } from "@/lib/api";
import { Field, Select, ProvinceDistrict } from "@/components/RegisterFields";

const ADMIN_ROLES: Role[] = ["admin", "gbv_officer", "developer"];

export const Route = createFileRoute("/register/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administrator Access Request — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegisterAdmin,
});

function RegisterAdmin() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
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
        department: String(f.get("organisation") ?? "").trim() || undefined,
      });
      setDone(true);
      toast.success("Administrator request submitted for approval");
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
            Your administrator request is awaiting Super Admin approval.
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
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Administrator access</h1>
            <p className="text-sm text-muted-foreground">For coordinators who review and allocate cases.</p>
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
          <Field label="Organisation / Institution" name="organisation" required placeholder="e.g. Ministry of Health — Lusaka" />

          <ProvinceDistrict
            province={province} district={district}
            onProvince={setProvince} onDistrict={setDistrict}
          />

          <Select
            label="Administrative role" name="role" required value={role} onChange={setRole}
            placeholder="Select role…"
            options={ADMIN_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            hint="Super Admin accounts are created only by the system owner."
          />

          <Field label="Password" name="password" type="password" required placeholder="At least 8 characters" />

          <button
            type="submit" disabled={loading}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit administrator request"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Responding on the ground instead?{" "}
            <Link to="/register/responder" className="text-brand font-medium">Register as a responder</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
