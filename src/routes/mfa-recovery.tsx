import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recoveryUnlockFn } from "@/lib/security.functions";
import { apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/mfa-recovery")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Two-factor recovery — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MfaRecovery,
});

function MfaRecovery() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await recoveryUnlockFn({
        data: {
          email: String(f.get("email") ?? "").trim().toLowerCase(),
          password: String(f.get("password") ?? ""),
          code: String(f.get("code") ?? ""),
        },
      });
      setDone(true);
      toast.success("Two-factor reset. Sign in and set up a new authenticator.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="min-h-[70vh] grid place-items-center p-6">
        <div className="w-full max-w-md card-soft p-8 text-center">
          <h1 className="text-2xl font-bold">Two-factor removed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your recovery code has been used. Sign in again and you'll be asked to set up a new
            authenticator app straight away.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate({ to: "/basecontrol" })}>
            Go to sign in
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md card-soft p-8">
        <LifeBuoy className="h-8 w-8 text-brand" />
        <h1 className="mt-3 text-2xl font-bold">Use a recovery code</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email, password and one unused recovery code. This removes the current
          authenticator so you can set up a new one.
        </p>
        <div className="mt-6 space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="code">Recovery code</Label>
            <Input id="code" name="code" placeholder="ABCDE-FGHIJ" required />
          </div>
        </div>
        <Button type="submit" className="mt-5 w-full" disabled={busy}>
          {busy ? "Checking…" : "Reset two-factor"}
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to="/basecontrol" className="text-brand font-medium">Back to sign in</Link>
        </p>
      </form>
    </section>
  );
}
