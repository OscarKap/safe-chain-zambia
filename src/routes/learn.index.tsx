import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Clock, BookOpen, Bookmark as BookmarkIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { articles, categories, articleReadingTime, type Category } from "@/data/articles";
import { BookmarkButton, useBookmarks } from "@/components/Bookmark";

export const Route = createFileRoute("/learn/")({
  head: () => ({ meta: [
    { title: "Learning Hub — Safe Chain" },
    { name: "description", content: "In-app SRHR, mental health, GBV, HIV, consent and youth rights lessons for young people in Zambia. Read offline-friendly, in your own time." },
  ]}),
  component: Learn,
});

type Filter = "All" | "Saved" | Category;

function Learn() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const { bookmarks } = useBookmarks();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles.filter(a => {
      if (filter === "Saved" && !bookmarks.includes(a.slug)) return false;
      if (filter !== "All" && filter !== "Saved" && a.category !== filter) return false;
      if (!term) return true;
      return (
        a.title.toLowerCase().includes(term) ||
        a.summary.toLowerCase().includes(term) ||
        a.tags.some(t => t.toLowerCase().includes(term)) ||
        a.content.toLowerCase().includes(term)
      );
    });
  }, [q, filter, bookmarks]);

  const chips: Filter[] = ["All", "Saved", ...categories];

  return (
    <>
      <PageHeader
        eyebrow="Learning Hub"
        title="Real answers, in your own time."
        description="A safe youth library on SRHR, mental wellbeing, consent, HIV, GBV and your rights — read it all inside Safe Chain. No redirects, no judgement."
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: pregnancy, period pain, HIV testing, depression…"
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring shadow-sm"
            aria-label="Search articles"
          />
        </div>
      </PageHeader>

      <section className="container-page py-6">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex gap-2 px-1 min-w-max">
            {chips.map(c => {
              const active = filter === c;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-brand text-brand-foreground border-brand shadow-sm"
                      : "border-border bg-card hover:bg-muted text-foreground"
                  }`}
                >
                  {c === "Saved" && <BookmarkIcon className="h-3.5 w-3.5" />}
                  {c}
                  {c === "Saved" && bookmarks.length > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/25" : "bg-brand-soft text-brand"}`}>
                      {bookmarks.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card-soft mt-8 p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No articles match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "Saved" ? "Bookmark articles to find them here later." : "Try another search term or category."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(a => (
              <Link
                key={a.slug}
                to="/learn/$slug"
                params={{ slug: a.slug }}
                className="group card-soft overflow-hidden flex flex-col active:scale-[0.99] transition"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={a.image}
                    alt=""
                    loading="lazy"
                    width={1280}
                    height={800}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" aria-hidden />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 text-foreground px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                    {a.category}
                  </span>
                  <BookmarkButton slug={a.slug} className="absolute right-3 top-3" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-lg font-bold leading-snug">{a.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">{a.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {articleReadingTime(a)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-brand font-semibold">
                      Read <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
