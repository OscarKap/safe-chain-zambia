import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications, apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { isValidPhone, whatsappLink } from "@/lib/contact";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const seen = useRef<Set<string> | null>(null);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: notifications.list,
    enabled: !!user,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  // Pop a toast for each new unread alert after the first load.
  useEffect(() => {
    if (!q.data) return;
    if (seen.current === null) { seen.current = new Set(q.data.map((n) => n.id)); return; }
    for (const n of q.data) {
      if (!seen.current.has(n.id)) {
        seen.current.add(n.id);
        if (!n.read) toast(n.message);
      }
    }
  }, [q.data]);

  const markOne = useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const markAll = useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => { toast.success("All marked read"); qc.invalidateQueries({ queryKey: ["notifications"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;
  const unread = q.data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-border bg-background shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending || unread === 0}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all
            </button>
          </div>
          <div className="p-2">
            {q.isLoading && <p className="p-3 text-sm text-muted-foreground">Loading…</p>}
            {q.error && <p className="p-3 text-sm text-destructive">{apiErrorMessage(q.error)}</p>}
            {q.data && q.data.length === 0 && <p className="p-3 text-sm text-muted-foreground">No notifications.</p>}
            <ul className="space-y-1">
              {q.data?.map((n) => (
                <li key={n.id} className={`rounded-lg p-3 text-sm ${n.read ? "opacity-60" : "bg-muted/40"}`}>
                  <button onClick={() => !n.read && markOne.mutate(n.id)} className="w-full text-left">
                    <p>{n.message}</p>
                    {n.created_at && <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>}
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {n.report_id && (
                      <a
                        href={n.type === "case_assigned" ? "/responder/dashboard" : `/admin/reports/${n.report_id}`}
                        onClick={() => { if (!n.read) markOne.mutate(n.id); setOpen(false); }}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Open case
                      </a>
                    )}
                    {n.whatsapp_to && isValidPhone(n.whatsapp_to) && (
                      <a
                        href={whatsappLink(n.whatsapp_to, n.whatsapp_text ?? "")}
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => { if (!n.read) markOne.mutate(n.id); }}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
