import { Globe } from "lucide-react";
import { AVAILABLE_LANGUAGES, useLanguage } from "@/lib/i18n/language-context";
import { isLanguageCode } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** Compact dropdown used in the site header. */
export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <label className={cn("inline-flex items-center gap-1.5", className)}>
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">Choose language</span>
      <select
        value={language}
        onChange={(e) => { if (isLanguageCode(e.target.value)) setLanguage(e.target.value); }}
        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {AVAILABLE_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.nativeName}</option>
        ))}
      </select>
    </label>
  );
}

/** Large card used on the home page so first-time visitors can pick a language. */
export function LanguagePicker() {
  const { language, setLanguage } = useLanguage();
  return (
    <section className="container-page py-8" aria-labelledby="lang-heading">
      <div className="card-soft p-6">
        <div className="flex items-center gap-2 text-brand">
          <Globe className="h-5 w-5" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider">Language / Ululimi</p>
        </div>
        <h2 id="lang-heading" className="mt-2 text-xl font-bold">
          Choose the language you are comfortable with
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Safe Chain content is shown in your language where a reviewed translation is available,
          and in English where it is not.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {AVAILABLE_LANGUAGES.map((l) => {
            const active = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand text-brand-foreground border-brand shadow-sm"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {l.nativeName}
                {l.nativeName !== l.name && (
                  <span className={cn("ml-1.5 text-xs", active ? "opacity-80" : "text-muted-foreground")}>
                    {l.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
