import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, LifeBuoy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/register/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Request Access — Safe Chain" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegisterChooser,
});

function RegisterChooser() {
  return (
    <section className="px-4 py-12 md:py-16">
      <div className="container-narrow max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Approval required
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">Request Safe Chain access</h1>
          <p className="mt-3 text-muted-foreground">
            Choose the type of account you need. Every request is reviewed and approved
            by the Safe Chain Super Admin before sign-in is enabled.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <ChoiceCard
            to="/register/admin"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Administrator"
            blurb="Coordinators, GBV officers and developers who review, allocate and monitor cases from the Base Control console."
            points={["Case oversight & dispatch", "Approve responders", "Analytics & reporting"]}
          />
          <ChoiceCard
            to="/register/responder"
            icon={<LifeBuoy className="h-5 w-5" />}
            title="Responder"
            blurb="Police VSU, health centres, churches, mental health, counselling and community volunteers who support survivors on the ground."
            points={["Receive assigned cases", "Matched by province & district", "Matched by case type you handle"]}
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already approved? <Link to="/basecontrol" className="text-brand font-medium">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

function ChoiceCard({ to, icon, title, blurb, points }: {
  to: string; icon: React.ReactNode; title: string; blurb: string; points: string[];
}) {
  return (
    <Link
      to={to}
      className="group card-soft p-6 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {p}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        Continue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
