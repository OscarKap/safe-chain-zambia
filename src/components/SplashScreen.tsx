import { useEffect, useState } from "react";

/**
 * Animated "Bloom Network" splash logo for Safe Chain.
 * Shows on first load, fades out after ~1.8s.
 */
export function SplashScreen() {
  const [hidden, setHidden] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHidden(true), 1800);
    const t2 = setTimeout(() => setGone(true), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-secondary transition-opacity duration-500 ${
        hidden ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <svg viewBox="0 0 240 240" className="h-44 w-44 sc-bloom" role="img" aria-label="Safe Chain loading">
        {/* outer ring connectors */}
        <g stroke="hsl(173 58% 28% / 0.55)" strokeWidth="1.5" fill="none" className="sc-lines">
          <polygon points="120,40 176,64 200,120 176,176 120,200 64,176 40,120 64,64" />
          <line x1="120" y1="40" x2="120" y2="200" />
          <line x1="40" y1="120" x2="200" y2="120" />
          <line x1="64" y1="64" x2="176" y2="176" />
          <line x1="176" y1="64" x2="64" y2="176" />
        </g>

        {/* outer nodes (8) */}
        <g className="sc-outer">
          {[
            [120, 40], [176, 64], [200, 120], [176, 176],
            [120, 200], [64, 176], [40, 120], [64, 64],
          ].map(([x, y], i) => {
            const orange = [1, 3, 5, 7].includes(i);
            return (
              <circle
                key={i}
                cx={x} cy={y} r="11"
                fill="white"
                stroke={orange ? "#F59E0B" : "#0F766E"}
                strokeWidth="4"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            );
          })}
        </g>

        {/* inner ring (4) */}
        <g className="sc-inner">
          {[[120, 80], [160, 120], [120, 160], [80, 120]].map(([x, y], i) => (
            <circle
              key={i}
              cx={x} cy={y} r="7"
              fill="white"
              stroke="#10B981"
              strokeWidth="3"
              style={{ animationDelay: `${i * 120 + 200}ms` }}
            />
          ))}
        </g>

        {/* central hub */}
        <g className="sc-core">
          <rect x="96" y="96" width="48" height="48" rx="6" fill="none" stroke="#0F766E" strokeWidth="2" />
          <circle cx="120" cy="120" r="18" fill="#0F766E" />
          <path d="M120 110 v10 M120 110 a4 4 0 1 1 -0.01 0" stroke="#A7F3D0" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      <div className="mt-6 text-center">
        <p className="text-3xl font-bold text-brand">Safe Chain</p>
        <p className="mt-1 text-[11px] tracking-[0.25em] font-semibold text-foreground/70">YOUTH SRHR PLATFORM</p>
        <p className="mt-3 text-sm text-foreground/60">Rooted. Growing. Thriving.</p>
      </div>

      <style>{`
        .sc-bloom { animation: sc-spin 6s linear infinite; transform-origin: 50% 50%; }
        .sc-lines { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: sc-draw 1.2s ease-out forwards; }
        .sc-outer circle, .sc-inner circle {
          transform-origin: center; transform-box: fill-box;
          opacity: 0; animation: sc-pop 600ms cubic-bezier(.34,1.56,.64,1) forwards;
        }
        .sc-core { transform-origin: 120px 120px; animation: sc-pulse 1.6s ease-in-out infinite; }
        @keyframes sc-draw { to { stroke-dashoffset: 0; } }
        @keyframes sc-pop { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes sc-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes sc-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .sc-bloom, .sc-core, .sc-lines, .sc-outer circle, .sc-inner circle { animation: none !important; opacity: 1 !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </div>
  );
}
