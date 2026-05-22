import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck, Phone, MapPin, BookOpen, MessageSquareWarning,
  Accessibility, Users, ArrowRight, Heart, Lock, Languages,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import communityImg from "@/assets/community.jpg";
import clinicImg from "@/assets/clinic.jpg";
import learningImg from "@/assets/learning.jpg";
import workshopImg from "@/assets/workshop.jpg";
import mobileImg from "@/assets/mobile.jpg";
import { Slideshow } from "@/components/Slideshow";

const slides = [
  { src: heroImg, alt: "Young Zambians smiling together", title: "Your safe link to health & rights", caption: "A youth-built platform for SRHR support, reporting, and community accountability." },
  { src: clinicImg, alt: "Young person outside a youth-friendly clinic", title: "Youth-friendly clinics, near you", caption: "Find accessible, judgment-free health services across 10+ districts." },
  { src: learningImg, alt: "Diverse youth learning together with tablets", title: "Learning that includes everyone", caption: "Lessons designed for girls, boys, and youth with disabilities — in 5 local languages." },
  { src: workshopImg, alt: "Peer educators leading an SRHR workshop", title: "Peer-led, community-rooted", caption: "Real conversations, led by young Zambians who understand your world." },
  { src: mobileImg, alt: "Young woman privately using her mobile phone", title: "Private by default", caption: "Report incidents anonymously — even over SMS when you're offline." },
  { src: communityImg, alt: "Community SRHR gathering", title: "Accountability you can see", caption: "Community scorecards turn lived experience into real change." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safe Chain — Youth SRHR, safe reporting & clinics in Zambia" },
      { name: "description", content: "Anonymous reporting, youth-friendly clinics, SRHR learning, and community accountability for young Zambians, including girls and youth with disabilities." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Home,
});

const features = [
  { icon: MessageSquareWarning, title: "Safe Reporting", desc: "Anonymously report GBV, abuse, or service issues. Track your case privately.", to: "/report" },
  { icon: MapPin, title: "Clinic Finder", desc: "Find youth-friendly, accessible health services near you.", to: "/services" },
  { icon: BookOpen, title: "Learning Hub", desc: "SRHR articles, audio and videos in local languages.", to: "/learn" },
  { icon: Users, title: "Community Scorecards", desc: "Rate services and hold providers accountable together.", to: "/feedback" },
  { icon: Phone, title: "Emergency Help", desc: "One-tap support and offline SMS fallback to 555.", to: "/emergency" },
  { icon: Accessibility, title: "Built for Everyone", desc: "Screen reader, large-text, and sign-language ready.", to: "/about" },
];

const stats = [
  { value: "10+", label: "Districts served" },
  { value: "150+", label: "Partner clinics" },
  { value: "5", label: "Local languages" },
  { value: "100%", label: "Anonymous reporting" },
];

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="gradient-hero">
        <div className="container-page py-14 md:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-warm" /> Built with youth, in Zambia
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
              Your safe link to <span className="text-brand">health, rights</span> & support.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Safe Chain helps young people — especially girls and youth with disabilities —
              access trusted SRHR information, report incidents safely, and connect with
              youth-friendly services across Zambia.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/emergency" className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition">
                <Phone className="h-4 w-4" /> Get emergency help
              </Link>
              <Link to="/learn" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
                Explore the hub <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted transition">
                Find a clinic
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Private by default</span>
              <span className="inline-flex items-center gap-1.5"><Accessibility className="h-3.5 w-3.5" /> Accessible</span>
              <span className="inline-flex items-center gap-1.5"><Languages className="h-3.5 w-3.5" /> 5 languages</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand/15 via-warm/10 to-secondary/30 blur-2xl" aria-hidden />
            <img
              src={heroImg}
              alt="Young Zambians smiling together — Safe Chain is built for every body."
              width={1536}
              height={1024}
              className="relative rounded-3xl border border-border shadow-xl object-cover w-full h-[380px] md:h-[460px]"
            />
            <div className="card-soft absolute -bottom-6 -left-2 md:-left-8 max-w-[260px] p-4 hidden sm:block">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Heart className="h-4 w-4 text-warm" /> 24/7 confidential support
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Text <strong>SAFECHAIN</strong> to <strong>555</strong> — works without internet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface">
        <div className="container-page py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-brand">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest font-semibold text-brand">What we offer</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">Everything a young person needs — in one safe place.</h2>
          <p className="mt-3 text-muted-foreground">From anonymous reporting to clinic locators and SRHR education, Safe Chain wraps it all in a calm, accessible experience.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="card-soft group p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Community split */}
      <section className="bg-surface border-y border-border">
        <div className="container-page py-16 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <img
            src={communityImg}
            alt="Community members gathering for an SRHR session"
            loading="lazy"
            className="rounded-3xl border border-border w-full h-[320px] md:h-[420px] object-cover"
          />
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-warm">Community-centered</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Accountability you can see.</h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Community scorecards turn lived experience into pressure for change. Rate
              services, share feedback, and follow how providers respond — together.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                "Public response timelines",
                "Service quality scorecards",
                "Anonymous testimonies",
                "District-level reports",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-brand" /> {t}
                </div>
              ))}
            </div>
            <Link to="/feedback" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Open scorecards <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand to-brand/80 p-10 md:p-14 text-brand-foreground">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-warm/30 blur-3xl" aria-hidden />
          <div className="relative max-w-2xl">
            <ShieldCheck className="h-8 w-8" />
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">Your story is safe with us.</h2>
            <p className="mt-3 opacity-90">
              Reports are anonymous by default. No phone number or name required.
              Even offline, you can SMS <strong>SAFECHAIN</strong> to <strong>555</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/report" className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-background/90">
                Make a report
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-brand-foreground/30 px-5 py-3 text-sm font-semibold hover:bg-brand-foreground/10">
                Learn how it works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
