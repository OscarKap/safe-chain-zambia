import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_DASHBOARD, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    if (!email || !password) return;
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Signed in");
      const to = ROLE_DASHBOARD[user.role] ?? "/admin/dashboard";
      navigate({ to });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="gradient-hero hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <ShieldCheck className="h-10 w-10 text-brand" />
          <h1 className="mt-4 text-4xl font-bold leading-tight">Safe Chain Console</h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to review reports, manage responders, and coordinate
            support. Access is granted after Super Admin approval.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand font-medium">Request access</Link>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-md card-soft p-8">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1">Approved Safe Chain users only.</p>

          <div className="mt-6 space-y-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Email</span>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@organisation.org"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Password</span>
              <input
                name="password" type="password" autoComplete="current-password" required
                className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </label>
            <div className="flex items-center justify-between text-sm">
              <Link to="/register" className="text-muted-foreground hover:text-foreground">Need access?</Link>
            </div>
            <button
              disabled={loading}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
