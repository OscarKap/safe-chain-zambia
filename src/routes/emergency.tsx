import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageSquare, AlertTriangle, Heart, ShieldCheck, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency Help — Safe Chain" }, { name: "description", content: "Immediate, confidential support for GBV, sexual assault, and SRHR emergencies in Zambia." }] }),
  component: Emergency,
});

const hotlines = [
  { name: "GBV & Child Protection", number: "933", desc: "24/7 toll-free national line", icon: ShieldCheck },
  { name: "Police Emergency", number: "991", desc: "For immediate danger", icon: AlertTriangle },
  { name: "Lifeline Zambia (Mental Health)", number: "933", desc: "Confidential counselling", icon: Heart },
  { name: "Safe Chain SMS", number: "555", desc: "Send: SAFECHAIN HELP", icon: MessageSquare },
];

function Emergency() {
  return (
    <>
      <PageHeader
        eyebrow="If you are in danger"
        title="Emergency help"
        description="Choose the support you need. Calls are free from any network. If it is not safe to call, send an SMS — it works without internet."
      />

      <section className="container-page py-10">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm">
            If you or someone near you is in immediate danger, dial <a href="tel:991" className="font-bold underline">991</a> now.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotlines.map((h) => (
            <a
              key={h.name}
              href={h.number === "555" ? "sms:555?body=SAFECHAIN HELP" : `tel:${h.number}`}
              className="card-soft p-5 hover:-translate-y-0.5 hover:shadow-lg transition"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <h.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold">{h.name}</h3>
              <p className="text-xs text-muted-foreground">{h.desc}</p>
              <p className="mt-3 text-2xl font-bold text-brand">{h.number}</p>
            </a>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-5">
          <div className="card-soft p-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Phone className="h-5 w-5 text-brand" /> What to expect when you call</h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal pl-5">
              <li>A trained responder will answer — you don't need to share your name.</li>
              <li>Tell them where you are if it's safe to. They can dispatch help.</li>
              <li>You can ask for a female responder, sign-language support, or a translator.</li>
              <li>Every call is confidential and free.</li>
            </ol>
          </div>
          <div className="card-soft p-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-brand" /> Find a safe place</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Youth-friendly clinics, one-stop GBV centres and shelters across Zambia are
              listed in our Service Directory. Most provide free emergency contraception,
              PEP, counselling and medical care.
            </p>
            <a href="/services" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Open clinic finder
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
