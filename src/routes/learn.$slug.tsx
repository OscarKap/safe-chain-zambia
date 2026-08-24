import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Clock, Share2, Phone, Volume2, AArrowUp, AArrowDown,
  AlertTriangle, Sparkles, ExternalLink,
} from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { BookmarkButton } from "@/components/Bookmark";
import { articles, articleBySlug, articleReadingTime } from "@/data/articles";

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => {
    const a = articleBySlug(params.slug);
    if (!a) return { meta: [{ title: "Article — Safe Chain" }] };
    return {
      meta: [
        { title: `${a.title} — Safe Chain Learning Hub` },
        { name: "description", content: a.summary },
        { property: "og:title", content: `${a.title} — Safe Chain` },
        { property: "og:description", content: a.summary },
        { property: "og:image", content: a.image },
      ],
    };
  },
  loader: ({ params }) => {
    const a = articleBySlug(params.slug);
    if (!a) throw notFound();
    return { slug: params.slug };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Article not found</h1>
      <Link to="/learn" className="mt-4 inline-block text-brand font-semibold">← Back to Learning Hub</Link>
    </div>
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Couldn't load article</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 text-brand font-semibold">Retry</button>
      </div>
    );
  },
  component: ArticleReader,
});

const FONT_KEY = "safechain:fontSize";
const PROG_KEY = (slug: string) => `safechain:progress:${slug}`;

function ArticleReader() {
  const { slug } = Route.useParams();
  const a = articleBySlug(slug)!;

  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem(FONT_KEY)) || 1;
  });

  useEffect(() => { localStorage.setItem(FONT_KEY, String(fontSize)); }, [fontSize]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (h.scrollTop / total) * 100)) : 0;
      setProgress(pct);
      if (pct > 5) localStorage.setItem(PROG_KEY(slug), String(Math.round(pct)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  // Restore reading position
  useEffect(() => {
    const saved = Number(localStorage.getItem(PROG_KEY(slug)));
    if (saved > 5 && saved < 95) {
      // small delay so layout is ready
      setTimeout(() => {
        const h = document.documentElement;
        const total = h.scrollHeight - h.clientHeight;
        window.scrollTo({ top: (saved / 100) * total, behavior: "instant" as ScrollBehavior });
      }, 50);
    }
  }, [slug]);

  const related = useMemo(
    () => articles.filter(x => x.slug !== slug && (x.category === a.category || x.tags.some(t => a.tags.includes(t)))).slice(0, 3),
    [slug, a]
  );

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${a.title} — Safe Chain`;
    if (navigator.share) {
      try { await navigator.share({ title: text, text: a.summary, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); alert("Link copied to clipboard"); } catch {}
  };

  return (
    <>
      {/* Scroll progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent" aria-hidden>
        <div className="h-full bg-brand transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {/* Sticky back / actions bar */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border">
        <div className="container-page flex items-center justify-between py-3 gap-2">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Hub
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFontSize(s => Math.max(0.9, +(s - 0.1).toFixed(2)))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-muted"
              aria-label="Decrease text size"
            >
              <AArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => setFontSize(s => Math.min(1.4, +(s + 0.1).toFixed(2)))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-muted"
              aria-label="Increase text size"
            >
              <AArrowUp className="h-4 w-4" />
            </button>
            <BookmarkButton slug={slug} />
            <button
              onClick={onShare}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-muted"
              aria-label="Share article"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <article className="container-page max-w-3xl py-6 md:py-10">
        {/* Hero */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <img
            src={a.image}
            alt=""
            width={1280}
            height={800}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-soft text-brand px-2.5 py-1 font-semibold">{a.category}</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {articleReadingTime(a)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground" title="Audio narration coming soon">
            <Volume2 className="h-3.5 w-3.5" /> Audio coming soon
          </span>
        </div>

        <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">{a.title}</h1>
        <p className="mt-3 text-base md:text-lg text-muted-foreground">{a.summary}</p>

        {a.showEmergency && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">If you are in danger right now</p>
              <p className="text-sm text-muted-foreground mt-0.5">Help is available. You don't have to wait.</p>
            </div>
            <Link
              to="/emergency"
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-semibold shrink-0"
            >
              <Phone className="h-3.5 w-3.5" /> Get help
            </Link>
          </div>
        )}

        {/* Body */}
        <div style={{ fontSize: `${fontSize}rem` }}>
          <Markdown source={a.content} />
        </div>

        {/* Quick facts (light helper) */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 text-brand">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Remember</p>
            </div>
            <p className="mt-2 text-sm text-foreground/85">
              You have the right to private, respectful information about your body and your health — without shame and without judgement.
            </p>
          </div>
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 text-brand">
              <Phone className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Where to get help</p>
            </div>
            <p className="mt-2 text-sm text-foreground/85">
              Find your nearest youth-friendly clinic on the{" "}
              <Link to="/services" className="font-semibold text-brand underline-offset-2 hover:underline">Services</Link>{" "}
              page, or use the{" "}
              <Link to="/emergency" className="font-semibold text-brand underline-offset-2 hover:underline">Emergency</Link>{" "}
              contacts.
            </p>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold">Related topics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map(r => (
                <Link
                  key={r.slug}
                  to="/learn/$slug"
                  params={{ slug: r.slug }}
                  className="card-soft overflow-hidden active:scale-[0.99] transition"
                >
                  <img src={r.image} alt="" loading="lazy" width={1280} height={800} className="aspect-[16/10] w-full object-cover" />
                  <div className="p-4">
                    <p className="text-xs font-semibold text-brand">{r.category}</p>
                    <p className="mt-1 font-semibold leading-snug">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Learn more (external, at the bottom only) */}
        <div className="mt-12 rounded-2xl bg-surface p-5">
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Want to go deeper?</p>
          <p className="mt-1 text-sm text-foreground/85">
            For more detail, trusted partners like the World Health Organization and Zambia Ministry of Health publish in-depth resources.
          </p>
          <a
            href="https://www.who.int/health-topics"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
          >
            Browse WHO health topics <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/learn" className="inline-flex items-center gap-2 rounded-full bg-brand text-brand-foreground px-5 py-2.5 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Learning Hub
          </Link>
        </div>
      </article>
    </>
  );
}
