import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

const KEY = "safechain:bookmarks";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function setBookmarks(list: string[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("safechain:bookmarks"));
}

export function useBookmarks() {
  // Always start empty so SSR HTML matches the first client render; hydrate after mount.
  const [list, setList] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setList(getBookmarks());
    const h = () => setList(getBookmarks());
    window.addEventListener("safechain:bookmarks", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("safechain:bookmarks", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  const toggle = (slug: string) => {
    const cur = getBookmarks();
    const next = cur.includes(slug) ? cur.filter(s => s !== slug) : [...cur, slug];
    setBookmarks(next);
  };
  return { bookmarks: list, toggle, isBookmarked: (s: string) => mounted && list.includes(s), mounted };
}

export function BookmarkButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { isBookmarked, toggle, mounted } = useBookmarks();
  const on = isBookmarked(slug);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      aria-pressed={on}
      aria-label={on ? "Remove bookmark" : "Save article"}
      suppressHydrationWarning
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur transition hover:bg-muted ${className}`}
    >
      {mounted && on
        ? <BookmarkCheck className="h-4 w-4 text-brand" />
        : <Bookmark className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}
