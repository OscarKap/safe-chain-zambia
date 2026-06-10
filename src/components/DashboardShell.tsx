import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ROLE_LABEL } from "@/lib/api";

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function onLogout() { logout(); navigate({ to: "/login", replace: true }); }
  return (
    <section className="container-page py-8 md:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {user && (
            <p className="text-sm text-muted-foreground mt-1">
              Signed in as <strong>{user.email}</strong> · {ROLE_LABEL[user.role]}
            </p>
          )}
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>
      {children}
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-soft p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card-soft p-5 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
