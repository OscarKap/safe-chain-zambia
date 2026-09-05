import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_ORDER, LANGUAGE_STORAGE_KEY,
  isLanguageCode, type LanguageCode,
} from "@/lib/i18n/config";
import { requestTranslationsFn } from "@/lib/i18n/i18n.functions";
import { AutoTranslate } from "@/lib/i18n/AutoTranslate";

interface LanguageState {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  /** Translate a UI string. Falls back to the English source. */
  t: (text: string, context?: string) => string;
  ready: boolean;
}

const Ctx = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [dict, setDict] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(true);

  const pending = useRef(new Map<string, string | undefined>());
  const requested = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the saved preference after hydration (avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguageCode(saved) && saved !== DEFAULT_LANGUAGE) setLanguageState(saved);
    } catch { /* storage unavailable */ }
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, code); } catch { /* ignore */ }
  }, []);

  // Changing language clears the in-memory cache for the previous one.
  useEffect(() => {
    setDict({});
    requested.current.clear();
    pending.current.clear();
    if (typeof document !== "undefined") document.documentElement.lang = language;
  }, [language]);

  const flush = useCallback(async (lang: LanguageCode) => {
    const items = [...pending.current.entries()].map(([text, context]) => ({ text, context }));
    pending.current.clear();
    if (items.length === 0 || lang === DEFAULT_LANGUAGE) return;
    setReady(false);
    try {
      const res = await requestTranslationsFn({ data: { language: lang, items } });
      if (res.language === lang) setDict((d) => ({ ...d, ...res.translations }));
    } catch {
      // Never break the page: English stays on screen.
    } finally {
      setReady(true);
    }
  }, []);

  const t = useCallback(
    (text: string, context?: string) => {
      if (language === DEFAULT_LANGUAGE || !text.trim()) return text;
      const hit = dict[text];
      if (hit) return hit;
      const seen = `${language}::${text}`;
      if (!requested.current.has(seen)) {
        requested.current.add(seen);
        pending.current.set(text, context);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(language), 120);
      }
      return text;
    },
    [dict, language, flush],
  );

  const value = useMemo(() => ({ language, setLanguage, t, ready }), [language, setLanguage, t, ready]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <AutoTranslate language={language} />
    </Ctx.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Shorthand: const t = useT(); t("Report an incident") */
export function useT() {
  return useLanguage().t;
}

export const AVAILABLE_LANGUAGES = LANGUAGE_ORDER.map((c) => LANGUAGES[c]);
