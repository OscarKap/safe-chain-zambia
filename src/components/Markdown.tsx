import { useMemo } from "react";

type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseMarkdown(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }

    if (ln.startsWith("# ")) { blocks.push({ type: "h1", text: ln.slice(2).trim() }); i++; continue; }
    if (ln.startsWith("## ")) { blocks.push({ type: "h2", text: ln.slice(3).trim() }); i++; continue; }
    if (ln.startsWith("### ")) { blocks.push({ type: "h3", text: ln.slice(4).trim() }); i++; continue; }

    if (/^- /.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2).trim()); i++; }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s/.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, "").trim()); i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // paragraph: consume until blank
    const para: string[] = [ln];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |- |\d+\.\s)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    blocks.push({ type: "p", text: para.join(" ").trim() });
  }
  return blocks;
}

function renderInline(text: string) {
  // bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, idx) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={idx}>{p.slice(2, -2)}</strong>
      : <span key={idx}>{p}</span>
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);
  return (
    <div className="prose-article">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case "h1": return null; // title rendered separately
          case "h2":
            return <h2 key={idx} className="mt-10 mb-3 text-2xl font-bold tracking-tight text-foreground">{b.text}</h2>;
          case "h3":
            return <h3 key={idx} className="mt-6 mb-2 text-lg font-semibold text-foreground">{b.text}</h3>;
          case "p":
            return <p key={idx} className="my-4 text-[1.05rem] leading-relaxed text-foreground/90">{renderInline(b.text)}</p>;
          case "ul":
            return (
              <ul key={idx} className="my-4 space-y-2 pl-1">
                {b.items.map((it, i) => (
                  <li key={i} className="flex gap-3 text-foreground/90 leading-relaxed">
                    <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="my-4 space-y-2 list-decimal pl-6 text-foreground/90 marker:text-brand marker:font-semibold">
                {b.items.map((it, i) => <li key={i} className="leading-relaxed pl-1">{renderInline(it)}</li>)}
              </ol>
            );
        }
      })}
    </div>
  );
}
