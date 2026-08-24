import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ROLE_DASHBOARD } from "@/lib/api";
import { NotificationBell } from "@/components/NotificationBell";

const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Find a Clinic" },
  { to: "/learn", label: "Learn" },
  { to: "/report", label: "Report" },
  { to: "/feedback", label: "Feedback" },
  { to: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dashTo = user ? ROLE_DASHBOARD[user.role] ?? "/dashboard" : "/basecontrol";

  async function handleSignOut() {
    await logout();
    navigate({ to: "/basecontrol", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <span>Safe Chain</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to} to={n.to}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              activeProps={{ className: "text-foreground bg-muted" }}
              activeOptions={{ exact: n.to === "/" }}
            >{n.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/emergency" className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition">
            Emergency Help
          </Link>
          {user && (
            <>
              <NotificationBell />
              <Link to={dashTo} className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition" aria-label="Sign out">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          )}
        </div>

        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("md:hidden border-t border-border bg-background", open ? "block" : "hidden")}>
        <div className="container-page py-3 grid gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted">
              {n.label}
            </Link>
          ))}
          <Link to="/emergency" onClick={() => setOpen(false)} className="mt-2 text-center rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
            Emergency Help
          </Link>
          {user && (
            <>
              <Link to={dashTo} onClick={() => setOpen(false)} className="mt-1 text-center rounded-full border border-border px-4 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <button onClick={() => { setOpen(false); void handleSignOut(); }} className="mt-1 text-center rounded-full border border-border px-4 py-2 text-sm font-medium">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
