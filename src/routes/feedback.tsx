import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Community Feedback — Safe Chain" }, { name: "description", content: "Rate health services, share experiences, and view community scorecards." }] }),
  component: Feedback,
});

const scorecard = [
  { district: "Lusaka", score: 4.3, reports: 128, trend: "+0.2" },
  { district: "Kitwe", score: 3.8, reports: 86, trend: "+0.1" },
  { district: "Livingstone", score: 4.1, reports: 64, trend: "0" },
  { district: "Ndola", score: 3.5, reports: 72, trend: "-0.1" },
  { district: "Chipata", score: 4.0, reports: 41, trend: "+0.3" },
];

function Feedback() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return toast.error("Please choose a rating");
    e.currentTarget.reset();
    setRating(0);
    toast.success("Thank you — your feedback helps services improve.");
  }

  return (
    <>
      <PageHeader
        eyebrow="Community accountability"
        title="Share your experience"
        description="Your honest feedback drives real change. Ratings are aggregated into public scorecards every month."
      />

      <section className="container-page py-10 grid lg:grid-cols-5 gap-8">
        <form onSubmit={onSubmit} className="lg:col-span-3 card-soft p-6 md:p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Clinic / Service</span>
              <input name="clinic" required placeholder="Lusaka Youth Health Center" className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">District</span>
              <input name="district" required placeholder="Lusaka" className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Your rating</legend>
            <div className="mt-2 flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} stars`}
                  className="p-1"
                >
                  <Star className={`h-8 w-8 ${ (hover || rating) >= n ? "fill-warm text-warm" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">What went well? What could be better?</span>
            <textarea name="comments" rows={5} placeholder="Your experience helps other young people choose safely." className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring resize-y" />
          </label>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {["Welcoming staff", "Privacy respected", "Accessible facility"].map(tag => (
              <label key={tag} className="flex items-center gap-2 rounded-xl border border-border p-3 has-[:checked]:bg-brand-soft has-[:checked]:border-brand cursor-pointer">
                <input type="checkbox" name="tags" value={tag} className="accent-[color:var(--brand)]" /> {tag}
              </label>
            ))}
          </div>

          <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 inline-flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" /> Submit feedback
          </button>
        </form>

        <aside className="lg:col-span-2 card-soft p-6 md:p-8">
          <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-brand" /> District scorecards</h3>
          <p className="text-sm text-muted-foreground mt-1">Live community ratings, updated monthly.</p>
          <ul className="mt-5 divide-y divide-border">
            {scorecard.map(s => (
              <li key={s.district} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{s.district}</p>
                  <p className="text-xs text-muted-foreground">{s.reports} reports · {s.trend} this month</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${(s.score / 5) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{s.score.toFixed(1)}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </>
  );
}
