import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Clock, ExternalLink, Headphones, Search, Video } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { topics, languages } from "@/data/knowledge";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [{ title: "Learning Hub — Safe Chain" }, { name: "description", content: "SRHR articles, audio and videos in local Zambian languages. Built for low-bandwidth and accessible learning." }] }),
  component: Learn,
});

function Learn() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"All" | "Health" | "Rights" | "Wellbeing">("All");
  const [lang, setLang] = useState("en");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return topics.filter(top =>
      (cat === "All" || top.category === cat) &&
      (!t || top.title.toLowerCase().includes(t) || top.description.toLowerCase().includes(t))
    );
  }, [q, cat]);

  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Knowledge that meets you where you are."
        description="Bite-sized SRHR lessons in five Zambian languages. Listen, read, or watch — whatever works for you."
      />

      <section className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["All", "Health", "Rights", "Wellbeing"] as const).map(c => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${cat === c ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <article key={t.id} className="card-soft p-6 flex flex-col">
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-brand-soft text-brand px-2.5 py-1 font-medium">{t.category}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {t.readTime}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-brand" /> {t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{t.description}</p>
              <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" /> Audio</span>
                <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>
                <span className="inline-flex items-center gap-1">{languages.find(l => l.code === lang)?.name}</span>
              </div>
              <a href={t.learnMore} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                Open lesson <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card-soft mt-6 p-10 text-center">
            <p className="font-semibold">No topics found</p>
            <p className="text-sm text-muted-foreground">Try a different search or category.</p>
          </div>
        )}
      </section>
    </>
  );
}
