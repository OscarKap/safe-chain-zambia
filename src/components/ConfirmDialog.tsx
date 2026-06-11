import { useEffect } from "react";

export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive, busy, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string;
  confirmLabel?: string; cancelLabel?: string;
  destructive?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !busy) onCancel(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="cd-title">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border p-6 shadow-xl">
        <h2 id="cd-title" className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm} disabled={busy}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 ${destructive ? "bg-destructive" : "bg-primary"} hover:opacity-90`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
