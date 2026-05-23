import { Link } from "@tanstack/react-router";
import { Home, Stethoscope, BookOpen, User, Phone } from "lucide-react";

type Tab = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  center?: boolean;
};

const tabs: Tab[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/services", label: "Services", icon: Stethoscope },
  { to: "/emergency", label: "SOS", icon: Phone, center: true },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/dashboard", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 items-end px-2 pt-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          if (t.center) {
            return (
              <li key={t.to} className="flex justify-center -mt-6">
                <Link
                  to={t.to}
                  aria-label="Emergency help"
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg ring-4 ring-background active:scale-95 transition"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                activeOptions={{ exact: t.exact }}
                activeProps={{ className: "text-brand" }}
                className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
