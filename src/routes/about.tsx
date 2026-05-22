import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, Heart, Languages, Lock, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import campaign from "@/assets/community.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Safe Chain" }, { name: "description", content: "Safe Chain is a youth-led civic-tech platform for SRHR, safe reporting and community accountability in Zambia." }] }),
  component: About,
});

const principles = [
  { icon: Lock, title: "Privacy first", desc: "Anonymous by default. No tracking, no profiling." },
  { icon: Accessibility, title: "Inclusive", desc: "Designed with girls and youth with disabilities, from day one." },
  { icon: Languages, title: "Local languages", desc: "English, Bemba, Tonga, Nyanja and Lozi at launch." },
  { icon: Heart, title: "Trauma-informed", desc: "Calm flows, clear language, no judgement." },
  { icon: Users, title: "Community-led", desc: "Scorecards turn lived experience into accountability." },
  { icon: ShieldCheck, title: "Low-bandwidth ready", desc: "Lightweight pages and SMS fallback for every feature." },
];

function About() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Safe Chain is a civic-tech platform for SRHR in Zambia."
        description="We connect young people — especially in rural and underserved communities — with trusted information, confidential reporting, and youth-friendly services."
      />

      <section className="container-page py-12 grid lg:grid-cols-2 gap-10 items-center">
        <img src={campaign} alt="Community gathering" loading="lazy" className="rounded-3xl border border-border w-full h-80 object-cover" />
        <div>
          <h2 className="text-3xl font-bold">Why we built this</h2>
          <p className="mt-3 text-muted-foreground">
            Across rural Zambia, young people face real barriers to SRHR — distance,
            stigma, and a lack of trustworthy information. Safe Chain is built with
            youth advocates, health workers, and disability-led organisations to
            bridge that gap.
          </p>
          <p className="mt-3 text-muted-foreground">
            Every line of code, every flow, and every illustration is shaped by what
            users tell us they need. We test in low-bandwidth conditions, on entry-level
            phones, and with assistive technology.
          </p>
        </div>
      </section>

      <section className="container-page py-8">
        <h2 className="text-2xl font-bold">Our principles</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {principles.map(p => (
            <div key={p.title} className="card-soft p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><p.icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-brand to-brand/85 text-brand-foreground p-10 text-center">
          <h2 className="text-3xl font-bold">Partner with Safe Chain</h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">We work with NGOs, ministries and youth networks to scale safe reporting and SRHR access across Zambia.</p>
          <Link to="/feedback" className="mt-6 inline-flex rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-background/90">Get in touch</Link>
        </div>
      </section>
    </>
  );
}
