import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign in — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
    navigate({ to: "/admin-console" });
  }

  async function onForgot() {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value?.trim();
    if (!email) { toast.info("Enter your email above first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/setup`,
    });
    if (error) toast.error(error.message); else toast.success("Reset link sent (if the email exists).");
  }

  return (
    <section className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="gradient-hero hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <ShieldCheck className="h-10 w-10 text-brand" />
          <h1 className="mt-4 text-4xl font-bold leading-tight">Safe Chain Admin Console</h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to review reports, manage responders, and update referral
            information. Access is invite-only.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Not an admin yet?{" "}
            <Link to="/admin" className="text-brand font-medium">Request access</Link>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-md card-soft p-8">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1">
            For approved Safe Chain administrators only.
          </p>

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
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">Need access?</Link>
              <button type="button" onClick={onForgot} className="text-brand font-medium">Forgot password?</button>
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
