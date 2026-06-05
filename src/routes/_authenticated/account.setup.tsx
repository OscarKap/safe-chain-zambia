import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { completeFirstLogin, getMyAdminContext } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/account/setup")({
  head: () => ({ meta: [{ title: "Set up your account — Safe Chain" }, { name: "robots", content: "noindex" }] }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const getCtx = useServerFn(getMyAdminContext);
  const complete = useServerFn(completeFirstLogin);
  const { data } = useQuery({ queryKey: ["admin-ctx"], queryFn: () => getCtx() });
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [accept, setAccept] = useState(false);

  const mut = useMutation({
    mutationFn: (input: { password: string; accept_privacy: true }) => complete({ data: input }),
    onSuccess: () => { toast.success("Account ready"); navigate({ to: "/admin-console" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { toast.error("Passwords do not match"); return; }
    if (!accept) { toast.error("Please accept the privacy commitments"); return; }
    mut.mutate({ password: pw, accept_privacy: true });
  }

  return (
    <section className="px-4 py-12">
      <div className="container-narrow max-w-md card-soft p-8">
        <KeyRound className="h-8 w-8 text-brand" />
        <h1 className="mt-3 text-2xl font-bold">Set up your admin account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{data?.email ?? "…"}</span>. Please choose a strong password before continuing.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
          <label className="grid gap-1.5">
            <span className="font-medium">New password</span>
            <input
              type="password" required minLength={10}
              value={pw} onChange={(e) => setPw(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              autoComplete="new-password"
            />
            <span className="text-xs text-muted-foreground">10+ characters, must include upper, lower, and number.</span>
          </label>
          <label className="grid gap-1.5">
            <span className="font-medium">Confirm password</span>
            <input
              type="password" required minLength={10}
              value={pw2} onChange={(e) => setPw2(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              autoComplete="new-password"
            />
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1 accent-[color:var(--brand)]" />
            <span>I agree to keep user data confidential and follow the Safe Chain privacy policy.</span>
          </label>
          <button disabled={mut.isPending} className="w-full rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {mut.isPending ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
    </section>
  );
}
