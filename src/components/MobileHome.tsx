import { Link } from "@tanstack/react-router";
import {
  Bell, Zap, MapPin, Stethoscope, Phone, ShieldAlert, HeartPulse,
  Droplet, Brain, HelpCircle, Scale, Accessibility, MessageSquareWarning,
  Users, ChevronRight, Lock, BookOpen,
} from "lucide-react";

type Action = {
  to: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
};

const actions: Action[] = [
  { to: "/services",        title: "Find Nearby Services", icon: MapPin,              className: "bg-gradient-to-br from-teal-500 to-teal-600 text-white" },
  { to: "/services",        title: "Talk to a Health Worker", icon: Stethoscope,      className: "bg-gradient-to-br from-sky-500 to-blue-600 text-white" },
  { to: "/emergency",       title: "Emergency Help",      icon: Phone,                className: "bg-gradient-to-br from-rose-500 to-red-600 text-white" },
  { to: "/report",          title: "Report GBV Safely",   icon: ShieldAlert,          className: "bg-gradient-to-br from-amber-500 to-orange-600 text-white" },
  { to: "/learn/hiv",       title: "HIV / STI Info",      icon: HeartPulse,           className: "bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white" },
  { to: "/learn/menstrual", title: "Period Support",      icon: Droplet,              className: "bg-gradient-to-br from-pink-500 to-rose-500 text-white" },
  { to: "/learn/mental",    title: "Mental Health Help",  icon: Brain,                className: "bg-gradient-to-br from-violet-500 to-purple-600 text-white" },
  { to: "/learn/consent",   title: "Consent & Boundaries",icon: HelpCircle,           className: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" },
  { to: "/learn/rights",    title: "Youth Rights",        icon: Scale,                className: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white" },
  { to: "/services",        title: "Disability Support",  icon: Accessibility,        className: "bg-gradient-to-br from-cyan-500 to-sky-600 text-white" },
  { to: "/learn/gbv",       title: "GBV Awareness",       icon: MessageSquareWarning, className: "bg-gradient-to-br from-orange-500 to-amber-600 text-white" },
  { to: "/learn/relationships", title: "Healthy Love",    icon: Users,                className: "bg-gradient-to-br from-lime-500 to-green-600 text-white" },
];

const helpfulInfo = [
  { to: "/about",  title: "Your Privacy Matters", desc: "We keep your info safe and private.", icon: Lock,         tint: "bg-amber-100 text-amber-700" },
  { to: "/learn",  title: "Healthy Tips for You", desc: "Simple steps for a healthier you.",  icon: HeartPulse,   tint: "bg-violet-100 text-violet-700" },
  { to: "/feedback", title: "You're Not Alone",   desc: "Support is always within reach.",     icon: Users,        tint: "bg-emerald-100 text-emerald-700" },
];

export function MobileHome() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="md:hidden">
      {/* Top bar with brand + bell */}
      <div className="container-page pt-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-extrabold tracking-tight">
            <span className="text-brand">Safe</span>
            <span className="text-warm">Chain</span>
          </p>
          <p className="text-xs text-muted-foreground">Health & safety for young Zambians</p>
        </div>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border shadow-sm"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-warm" aria-hidden />
        </button>
      </div>

      {/* Greeting card */}
      <div className="container-page mt-4">
        <div className="rounded-3xl bg-gradient-to-br from-brand-soft via-secondary to-brand-soft p-5 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-warm/20 blur-2xl" aria-hidden />
          <h1 className="text-2xl font-bold text-foreground">{greet}! 👋</h1>
          <p className="mt-1 text-sm text-foreground/80">Your health matters.</p>
          <p className="text-sm text-foreground/80">Support is always within reach. 💚</p>
        </div>
      </div>

      {/* Quick actions header */}
      <div className="container-page mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">Quick Actions</h2>
        <Link
          to="/emergency"
          className="inline-flex items-center gap-1.5 rounded-full bg-warm/15 px-3 py-1.5 text-xs font-semibold text-warm-foreground"
        >
          Need help now? <Zap className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 2-column action grid */}
      <div className="container-page mt-3 grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.title}
              to={a.to}
              aria-label={a.title}
              className={`group relative overflow-hidden rounded-2xl p-4 min-h-[110px] flex flex-col justify-between shadow-sm active:scale-[0.98] transition ${a.className}`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex items-end justify-between gap-2">
                <p className="text-sm font-semibold leading-tight pr-1">{a.title}</p>
                <ChevronRight className="h-5 w-5 shrink-0 rounded-full bg-white/25 p-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Helpful info */}
      <div className="container-page mt-7 flex items-center justify-between">
        <h2 className="text-lg font-bold">Helpful Info</h2>
        <Link to="/learn" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="container-page mt-3 grid grid-cols-3 gap-3 pb-4">
        {helpfulInfo.map((h) => {
          const Icon = h.icon;
          return (
            <Link
              key={h.title}
              to={h.to}
              className="card-soft p-3 flex flex-col gap-2 active:scale-[0.98] transition"
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${h.tint}`}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-[13px] font-semibold leading-tight">{h.title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">{h.desc}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground mt-auto" />
            </Link>
          );
        })}
      </div>

      {/* Learn promo */}
      <div className="container-page pb-8">
        <Link
          to="/learn"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 active:scale-[0.99] transition"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Learn at your own pace</p>
            <p className="text-xs text-muted-foreground">SRHR lessons in 5 local languages — works offline.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
