import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { auth, ROLE_LABEL, apiErrorMessage, type Role } from "@/lib/api";

const ROLE_OPTIONS: Role[] = ["responder", "gbv_officer", "counsellor", "admin", "developer"];

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Request Access — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      first_name: String(f.get("first_name") ?? "").trim(),
      last_name: String(f.get("last_name") ?? "").trim(),
      email: String(f.get("email") ?? "").trim(),
      phone: String(f.get("phone") ?? "").trim(),
      password: String(f.get("password") ?? ""),
      role: String(f.get("role") ?? "") as Role,
    };
    if (body.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await auth.register(body);
      setDone(true);
      toast.success("Request submitted for approval");
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
            Your registration is awaiting Super Admin approval. You'll be able
            to sign in once approved.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10 md:py-14">
      <div className="container-narrow max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Request Access</h1>
            <p className="text-sm text-muted-foreground">All registrations require Super Admin approval.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card-soft mt-6 p-6 md:p-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name" name="first_name" required />
            <Field label="Last name" name="last_name" required />
          </div>
          <Field label="Email" name="email" type="email" required />
          <Field label="Phone" name="phone" type="tel" required placeholder="+260…" />
          <Field label="Password" name="password" type="password" required placeholder="At least 8 characters" />

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Role <span className="text-destructive">*</span></span>
            <select
              name="role" required defaultValue=""
              className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>Select role…</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </label>

          <button
            type="submit" disabled={loading}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit request"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Already approved? <Link to="/login" className="text-brand font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
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
