import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications, apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: notifications.list,
    enabled: !!user,
    refetchInterval: 60_000,
  });

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
                <li key={n.id}>
                  <button
                    onClick={() => !n.read && markOne.mutate(n.id)}
                    className={`w-full text-left rounded-lg p-3 text-sm hover:bg-muted ${n.read ? "opacity-60" : "bg-muted/40"}`}
                  >
                    <p>{n.message}</p>
                    {n.created_at && <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
