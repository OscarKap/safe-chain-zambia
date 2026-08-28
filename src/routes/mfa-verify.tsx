import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/mfa-verify")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Two-factor verification — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MfaVerify,
});

function MfaVerify() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) throw fErr;
      const factor = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (!factor) throw new Error("No authenticator app is set up for this account.");
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: code.replace(/\s/g, ""),
      });
      if (error) throw new Error("That code isn't valid. Check your authenticator app and try again.");
      toast.success("Verified");
      navigate({ to: (redirect as never) ?? ("/admin/dashboard" as never), replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md card-soft p-8">
        <KeyRound className="h-8 w-8 text-brand" />
        <h1 className="mt-3 text-2xl font-bold">Two-factor verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </p>
        <div className="mt-6 grid gap-1.5">
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456"
            value={code} onChange={(e) => setCode(e.target.value)} required
          />
        </div>
        <Button type="submit" className="mt-5 w-full" disabled={busy || code.replace(/\s/g, "").length < 6}>
          {busy ? "Verifying…" : "Verify"}
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Lost your device?{" "}
          <Link to="/mfa-recovery" className="text-brand font-medium">Use a recovery code</Link>
        </p>
      </form>
    </section>
  );
}
