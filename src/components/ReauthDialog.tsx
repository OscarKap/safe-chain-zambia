import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reauthFn, reauthStatusFn } from "@/lib/security.functions";
import { apiErrorMessage } from "@/lib/api";

/**
 * Step-up re-authentication gate for sensitive admin actions.
 * `ensure()` resolves true once the user has a valid (10 minute) password grant.
 */
export function useReauthGate() {
  const [resolver, setResolver] = useState<((ok: boolean) => void) | null>(null);

  const ensure = useCallback(async () => {
    try {
      const status = await reauthStatusFn();
      if (status.valid) return true;
    } catch { /* fall through to prompt */ }
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const finish = useCallback((ok: boolean) => {
    resolver?.(ok);
    setResolver(null);
  }, [resolver]);

  const dialog: ReactNode = (
    <ReauthDialog open={!!resolver} onDone={finish} />
  );

  return { ensure, dialog };
}

export function ReauthDialog({ open, onDone }: { open: boolean; onDone: (ok: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await reauthFn({ data: { password } });
      setPassword("");
      toast.success("Identity confirmed");
      onDone(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPassword(""); onDone(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-brand" /> Confirm it's you
          </DialogTitle>
          <DialogDescription>
            This is a sensitive action. Re-enter your password to continue. The confirmation lasts 10 minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={confirm} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onDone(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || password.length < 6}>
              {busy ? "Checking…" : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
