import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Safe Chain" }] }),
  component: Login,
});

function Login() {
  return (
    <section className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="gradient-hero hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <ShieldCheck className="h-10 w-10 text-brand" />
          <h1 className="mt-4 text-4xl font-bold leading-tight">Welcome back.</h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to track your reports, save resources, and share confidential
            feedback. Your account is private and never sold.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form
          onSubmit={(e) => { e.preventDefault(); toast.info("Enable Lovable Cloud to activate real authentication."); }}
          className="w-full max-w-md card-soft p-8"
        >
          <h2 className="text-2xl font-bold">Sign in to Safe Chain</h2>
          <p className="text-sm text-muted-foreground mt-1">New here? <Link to="/login" className="text-brand font-medium">Create an account</Link></p>

          <div className="mt-6 space-y-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Email or phone</span>
              <input required className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Password</span>
              <input required type="password" className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[color:var(--brand)]" /> Remember me</label>
              <a href="#" className="text-brand font-medium">Forgot password?</a>
            </div>
            <button className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Sign in</button>
            <p className="text-center text-xs text-muted-foreground">By signing in you agree to our privacy commitments.</p>
          </div>
        </form>
      </div>
    </section>
  );
}
