import { Link } from "@tanstack/react-router";
import { MessageSquareWarning, MapPinOff, ImageOff, UserX, ArrowRight } from "lucide-react";

const forms = [
  { icon: MessageSquareWarning, label: "Harassment & threats" },
  { icon: MapPinOff, label: "Stalking & monitoring" },
  { icon: ImageOff, label: "Image-based abuse" },
  { icon: UserX, label: "Impersonation & doxxing" },
];

/** Homepage awareness block for GBV including technology-facilitated GBV. */
export function TfgbvAwareness({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-brand/25 bg-brand-soft/50 ${compact ? "p-5" : "p-8 md:p-10"}`}>
      <p className="text-xs uppercase tracking-widest font-semibold text-brand">GBV & TFGBV</p>
      <h2 className={`mt-2 font-bold ${compact ? "text-xl" : "text-3xl md:text-4xl"}`}>
        Your safety matters online and offline.
      </h2>
      <p className={`mt-3 text-muted-foreground ${compact ? "text-sm" : "max-w-3xl"}`}>
        Technology can connect us, but it can also be used to threaten, harass, exploit, monitor or abuse people.
        SafeChain provides information, support, reporting options and referral pathways for people experiencing
        GBV and technology-facilitated gender-based violence.
      </p>
      <div className={`mt-5 grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-4"}`}>
        {forms.map((f) => (
          <div key={f.label} className="flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2.5 text-sm">
            <f.icon className="h-4 w-4 text-brand shrink-0" aria-hidden />
            <span className="leading-tight">{f.label}</span>
          </div>
        ))}
      </div>
      <Link
        to="/support"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
      >
        Get TFGBV Support <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
