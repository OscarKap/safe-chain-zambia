import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="gradient-hero border-b border-border">
      <div className="container-page py-12 md:py-16">
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest font-semibold text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
            {description}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
