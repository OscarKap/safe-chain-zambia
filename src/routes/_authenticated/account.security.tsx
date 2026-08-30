import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Copy, RefreshCw, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { issueRecoveryCodesFn, recoveryCodeStatusFn } from "@/lib/security.functions";
import { apiErrorMessage, ROLE_DASHBOARD } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/account/security")({
  head: () => ({
    meta: [
      { title: "Account security — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountSecurity,
});

interface EnrollState { factorId: string; qr: string; secret: string }

function AccountSecurity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [codeStatus, setCodeStatus] = useState<{ total: number; remaining: number } | null>(null);

  const loadState = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = (data?.totp ?? []).filter((f) => f.status === "verified");
    setEnrolled(verified.length > 0);
    if (verified.length > 0) {
      try { setCodeStatus(await recoveryCodeStatusFn()); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => { void loadState(); }, [loadState]);

  async function startEnroll() {
    setBusy(true);
    try {
      // Clean up any unverified factor left from a previous attempt.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.all ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Safe Chain ${Date.now()}`,
      });
      if (error) throw error;
      setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enroll.factorId,
        code: code.replace(/\s/g, ""),
      });
      if (error) throw new Error("That code isn't valid. Try the next code from your app.");
      const res = await issueRecoveryCodesFn();
      setCodes(res.codes);
      setEnroll(null);
      setCode("");
      await loadState();
      toast.success("Two-factor authentication is on");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      const res = await issueRecoveryCodesFn();
      setCodes(res.codes);
      setCodeStatus({ total: res.codes.length, remaining: res.codes.length });
      toast.success("New recovery codes generated. Old codes no longer work.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page py-8 space-y-6">
      <PageHeader
        title="Account security"
        subtitle="Two-factor authentication is required for all Safe Chain staff accounts."
      />

      {enrolled === false && !enroll && (
        <div className="card-soft p-6">
          <div className="flex items-start gap-3">
            <Smartphone className="h-6 w-6 text-brand shrink-0" />
            <div>
              <h2 className="font-semibold">Set up your authenticator app</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Install Google Authenticator, Microsoft Authenticator or Authy, then scan the
                code on the next step. You'll need a 6-digit code each time you sign in.
              </p>
            </div>
          </div>
          <Button className="mt-4" onClick={startEnroll} disabled={busy}>
            {busy ? "Preparing…" : "Start setup"}
          </Button>
        </div>
      )}

      {enroll && (
        <form onSubmit={verifyEnroll} className="card-soft p-6 space-y-4">
          <h2 className="font-semibold">Scan this code</h2>
          <img src={enroll.qr} alt="Two-factor QR code" className="h-48 w-48 rounded-lg bg-white p-2" />
          <p className="text-sm text-muted-foreground">
            Can't scan? Enter this key manually:{" "}
            <code className="font-mono text-foreground break-all">{enroll.secret}</code>
          </p>
          <div className="grid gap-1.5 max-w-xs">
            <Label htmlFor="totp">6-digit code</Label>
            <Input id="totp" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || code.replace(/\s/g, "").length < 6}>
              {busy ? "Verifying…" : "Turn on two-factor"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEnroll(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {enrolled && (
        <div className="card-soft p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <h2 className="font-semibold">Two-factor authentication is on</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {codeStatus
              ? `${codeStatus.remaining} of ${codeStatus.total} recovery codes remaining.`
              : "Recovery codes protect you if you lose your phone."}
          </p>
          <Button variant="outline" className="mt-4" onClick={regenerate} disabled={busy}>
            <RefreshCw className="h-4 w-4 mr-2" /> Generate new recovery codes
          </Button>
        </div>
      )}

      {codes && (
        <div className="card-soft p-6">
          <h2 className="font-semibold">Save your recovery codes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Each code works once. Store them somewhere safe — they are shown only now.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">
            {codes.map((c) => <li key={c} className="rounded-md border border-border px-3 py-2">{c}</li>)}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(codes.join("\n"));
                toast.success("Codes copied");
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy codes
            </Button>
            <Button
              onClick={() => {
                setCodes(null);
                navigate({ to: (ROLE_DASHBOARD[user?.role ?? "responder"] ?? "/admin/dashboard") as never });
              }}
            >
              I've saved them
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
