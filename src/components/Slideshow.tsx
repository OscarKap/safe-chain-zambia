import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  src: string;
  alt: string;
  title: string;
  caption: string;
};

export function Slideshow({ slides, interval = 5000 }: { slides: Slide[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [paused, interval, slides.length]);

  const go = (n: number) => setI((n + slides.length) % slides.length);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border shadow-xl group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {slides.map((s, idx) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={idx !== i}
          >
            <img
              src={s.src}
              alt={s.alt}
              width={1536}
              height={1024}
              loading={idx === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-background">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/15 backdrop-blur px-3 py-1 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-warm" /> Safe Chain
              </span>
              <h3 className="mt-3 text-2xl md:text-4xl font-bold max-w-2xl">{s.title}</h3>
              <p className="mt-2 text-sm md:text-base opacity-90 max-w-xl">{s.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => go(i - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-8 bg-background" : "w-2 bg-background/50 hover:bg-background/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
