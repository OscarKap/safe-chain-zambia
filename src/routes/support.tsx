import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, FileWarning, MapPin, Phone, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TFGBV_SUPPORT_MESSAGE, TFGBV_INCIDENT_TYPES, EVIDENCE_SAFETY_WARNING } from "@/data/tfgbv";

const TITLE = "GBV & TFGBV Support — Safe Chain";
const DESC = TFGBV_SUPPORT_MESSAGE;

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Support,
});

const steps = [
  { icon: BookOpen, title: "Learn", desc: "Understand GBV and technology-facilitated abuse, warning signs and your rights.", to: "/learn" as const, search: { topic: "tfgbv" }, cta: "TFGBV learning topics" },
  { icon: FileWarning, title: "Report", desc: "Report confidentially — anonymously if you prefer. Choose TFGBV as the incident type.", to: "/report" as const, cta: "Make a safe report" },
  { icon: MapPin, title: "Get referred", desc: "Find verified clinics, one-stop centres and support services near you.", to: "/services" as const, cta: "Find a service" },
  { icon: Phone, title: "Urgent help", desc: "If you face an immediate threat — online or offline — reach emergency referral lines.", to: "/emergency" as const, cta: "Emergency contacts" },
];

function Support() {
  return (
    <>
      <PageHeader eyebrow="GBV, TFGBV & Safety" title="GBV & TFGBV Support" description={TFGBV_SUPPORT_MESSAGE} />

      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Link key={s.title} to={s.to} search={"search" in s ? s.search : undefined} className="card-soft p-5 flex flex-col hover:-translate-y-0.5 transition">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><s.icon className="h-5 w-5" /></span>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground flex-1">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">{s.cta} <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-5">
          <div className="card-soft p-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-brand" /> What counts as TFGBV?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              TFGBV can affect people of different ages and backgrounds. If technology is being used to threaten, control, exploit, harass or harm you, you can seek support.
            </p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-1.5 text-sm">
              {TFGBV_INCIDENT_TYPES.map((t) => <li key={t} className="flex gap-2"><span className="text-brand">•</span>{t}</li>)}
            </ul>
          </div>
          <div className="card-soft p-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand" /> Stay safe while seeking help</h2>
            <p className="mt-3 text-sm text-muted-foreground">{EVIDENCE_SAFETY_WARNING}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Your report is seen only by authorised, trained responders and follows the same referral and case-management
              process as other GBV cases. You never need to upload intimate images to get help.
            </p>
            <Link to="/learn/$slug" params={{ slug: "tfgbv-help" }} className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              How to preserve evidence safely
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
