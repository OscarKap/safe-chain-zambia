// Page-wide translation layer.
//
// Existing pages are written in English. Rather than duplicating every screen
// per language, this component translates the rendered text of the page: it
// collects the visible English strings, asks the translation service for them
// (cache first, provider only for new strings), and swaps the text in place.
// Originals are kept so switching back to English is instant and lossless.
import { useEffect, useRef } from "react";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/i18n/config";
import { requestTranslationsFn } from "@/lib/i18n/i18n.functions";

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "SVG",
]);

const MAX_LEN = 400;
const BATCH = 40;

/** Original English text, kept per node so we can restore or retranslate. */
const originals = new WeakMap<Text, string>();
let tracked: Text[] = [];

function translatable(node: Text): boolean {
  const value = (originals.get(node) ?? node.nodeValue ?? "").trim();
  if (value.length < 2 || value.length > MAX_LEN) return false;
  if (!/[A-Za-z]{2}/.test(value)) return false; // numbers, icons, punctuation
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return false;
    if (el.hasAttribute("data-no-translate")) return false;
    el = el.parentElement;
  }
  return true;
}

function collect(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    if (translatable(node)) out.push(node);
    current = walker.nextNode();
  }
  return out;
}

function restoreAll() {
  for (const node of tracked) {
    const original = originals.get(node);
    if (original !== undefined && node.isConnected) node.nodeValue = original;
  }
  tracked = [];
}

export function AutoTranslate({ language }: { language: LanguageCode }) {
  const dict = useRef(new Map<string, string>());
  const asked = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);

  useEffect(() => {
    dict.current.clear();
    asked.current.clear();
    restoreAll();
    if (language === DEFAULT_LANGUAGE) return;

    let cancelled = false;

    const apply = (nodes: Text[]) => {
      for (const node of nodes) {
        const original = originals.get(node) ?? node.nodeValue ?? "";
        const hit = dict.current.get(original.trim());
        if (!hit) continue;
        if (!originals.has(node)) originals.set(node, original);
        if (!tracked.includes(node)) tracked.push(node);
        // Preserve the surrounding whitespace of the original text node.
        const lead = original.match(/^\s*/)?.[0] ?? "";
        const tail = original.match(/\s*$/)?.[0] ?? "";
        const next = `${lead}${hit}${tail}`;
        // Writing an identical value would retrigger the observer forever.
        if (node.nodeValue !== next) node.nodeValue = next;
      }
    };

    const scan = async () => {
      if (cancelled || running.current) return;
      const root = document.body;
      if (!root) return;
      const nodes = collect(root);
      for (const node of nodes) {
        if (!originals.has(node)) originals.set(node, node.nodeValue ?? "");
      }

      apply(nodes);

      const needed: string[] = [];
      for (const node of nodes) {
        const source = (originals.get(node) ?? "").trim();
        if (!source || dict.current.has(source) || asked.current.has(source)) continue;
        asked.current.add(source);
        needed.push(source);
      }
      if (needed.length === 0) return;

      running.current = true;
      try {
        for (let i = 0; i < needed.length; i += BATCH) {
          const slice = needed.slice(i, i + BATCH);
          const res = await requestTranslationsFn({
            data: { language, items: slice.map((text) => ({ text, context: "Safe Chain app interface text" })) },
          });
          if (cancelled || res.language !== language) return;
          for (const [source, translated] of Object.entries(res.translations)) {
            dict.current.set(source, translated);
          }
          apply(collect(document.body));
        }
      } catch {
        // Translation is best effort: English stays on screen.
      } finally {
        running.current = false;
      }
    };

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void scan(), 250);
    };

    schedule();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [language]);

  return null;
}
