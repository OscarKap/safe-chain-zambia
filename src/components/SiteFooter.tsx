import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="hidden md:block mt-24 border-t border-border bg-surface">
      <div className="container-page py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Safe Chain
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            A youth-led platform for sexual and reproductive health rights, safe
            reporting, and community accountability across Zambia.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            In an emergency, dial <strong>991</strong> or SMS <strong>SAFECHAIN</strong> to <strong>555</strong>.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services" className="hover:text-foreground">Find a clinic</Link></li>
            <li><Link to="/learn" className="hover:text-foreground">Learning hub</Link></li>
            <li><Link to="/report" className="hover:text-foreground">Safe reporting</Link></li>
            <li><Link to="/feedback" className="hover:text-foreground">Community feedback</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/emergency" className="hover:text-foreground">Emergency help</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About Safe Chain</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
          <p>© {new Date().getFullYear()} Safe Chain. Your privacy matters.</p>
          <p>Information only. Not a substitute for professional medical advice.</p>
        </div>
      </div>
    </footer>
  );
}
