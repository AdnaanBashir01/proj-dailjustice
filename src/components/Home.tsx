import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarCheck,
  FolderLock,
  Scale,
  Search,
  ShieldCheck,
  Sparkle,
  Star,
  Video,
} from "lucide-react";
import { LAWYERS, PRACTICE_AREAS, inr, type Lawyer } from "../lib/lawyerUtils";
import type { Lawyer as LawyerType } from "../data/lawyers";
import InitialsAvatar from "./InitialsAvatar";

interface Props {
  onNavigate: (view: "home" | "lawyers" | "dashboard", tab?: "bookings" | "documents" | "profile") => void;
  onBook: (lawyer: LawyerType) => void;
  onOpenChat: () => void;
}

const STEPS = [
  {
    icon: Search,
    step: "STEP 01",
    title: "Find your advocate",
    text: "Filter 250+ Bar-verified lawyers by practice area, budget, language and rating — or just ask Lexi to match you.",
  },
  {
    icon: CalendarCheck,
    step: "STEP 02",
    title: "Book a private slot",
    text: "Pick a date, time and format — video, phone or in-person. See the exact fee before you confirm. Never after.",
  },
  {
    icon: Video,
    step: "STEP 03",
    title: "Consult securely",
    text: "Join the encrypted video room from your dashboard, share documents from your vault, and get a written way forward.",
  },
];

export default function Home({ onNavigate, onBook, onOpenChat }: Props) {
  const featured = [...LAWYERS].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)[0];
  const topThree = [...LAWYERS].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 3);

  return (
    <div className="bg-[#f7f5f0]">
      {/* ─── Hero ─── */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 anim-fade-up">
            <Sparkle className="h-3 w-3 fill-gold-500 text-gold-500" />
            <span className="text-[10.5px] font-bold tracking-[0.28em] text-stone-500">
              LEGAL, MADE HUMAN
            </span>
          </div>

          <h1 className="mt-7 font-serif text-[52px] leading-[1.03] text-stone-900 anim-fade-up-1 sm:text-[64px] lg:text-[72px]">
            Justice,
            <br />
            <em className="text-stone-900">one consultation</em>
            <br />
            <em className="text-stone-400">
              away<span className="text-gold-500">.</span>
            </em>
          </h1>

          <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-stone-500 anim-fade-up-2">
            Find verified lawyers, book private video consultations, and keep every document in
            one encrypted vault. The right advice, before it costs you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4 anim-fade-up-3">
            <button
              onClick={() => onNavigate("lawyers")}
              className="group flex items-center gap-2.5 rounded-full bg-stone-900 px-7 py-4 text-[14px] font-bold text-white shadow-[0_18px_40px_-16px_rgba(23,20,18,0.45)] transition hover:bg-stone-800"
            >
              Find a lawyer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2.5 rounded-full border border-stone-300 bg-white px-7 py-4 text-[14px] font-bold text-stone-700 transition hover:border-stone-900"
            >
              <Bot className="h-4.5 w-4.5" />
              Chat with Lexi — 24/7
            </button>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-stone-200 pt-8">
            {[
              { n: "250+", l: "Verified advocates" },
              { n: "4.8", l: "Average rating" },
              { n: "38k", l: "Consultations done" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-serif text-[28px] font-semibold text-stone-900">{s.n}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero featured card */}
        <div className="relative anim-fade-up-2">
          <div className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_30px_70px_-34px_rgba(23,20,18,0.3)]">
            <div className="relative h-[380px]">
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-[#fbfaf7] to-stone-100" />
              <div className="absolute inset-0 flex items-center justify-center pb-20">
                <div className="relative">
                  <div className="absolute -inset-5 rounded-full border border-stone-300/70" />
                  <div className="absolute -inset-11 rounded-full border border-stone-200" />
                  <InitialsAvatar id={featured.id} name={featured.name} size={118} />
                </div>
              </div>
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-stone-900" />
                <span className="text-[10.5px] font-bold tracking-[0.14em] text-stone-700">
                  TOP RATED THIS WEEK
                </span>
              </div>
              <button
                onClick={onOpenChat}
                className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-stone-900 px-3.5 py-1.5 text-[10.5px] font-bold tracking-wide text-white shadow-lg transition hover:bg-stone-800 anim-float"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
                </span>
                LEXI ONLINE
              </button>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-serif text-[26px] font-semibold text-stone-900">{featured.name}</p>
                <p className="mt-0.5 text-[13px] text-stone-500">{featured.title}</p>
                <div className="mt-3 flex items-center gap-4 text-[12.5px] text-stone-500">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    {featured.rating} · {featured.reviews} reviews
                  </span>
                  <span className="text-stone-300">·</span>
                  <span>{featured.experience} yrs experience</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-stone-200 p-5">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Video consultation
                </p>
                <p className="mt-1 font-serif text-[22px] font-semibold text-stone-900">
                  {inr(featured.fee)}
                </p>
              </div>
              <button
                onClick={() => onBook(featured)}
                className="rounded-full bg-stone-900 px-6 py-3 text-[13px] font-bold text-white transition hover:bg-stone-800"
              >
                Book a slot
              </button>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-[0_20px_50px_-20px_rgba(23,20,18,0.3)] anim-float lg:-left-10">
            <ShieldCheck className="h-8 w-8 text-stone-900" strokeWidth={1.6} />
            <div>
              <p className="text-[12.5px] font-bold text-stone-900">100% private by design</p>
              <p className="text-[11px] text-stone-500">Encrypted sessions · You own your data</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marquee ─── */}
      <div className="overflow-hidden border-y border-stone-200 bg-white py-5">
        <div className="flex w-max anim-marquee gap-0">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {PRACTICE_AREAS.map((a) => (
                <span key={`${copy}-${a}`} className="flex items-center">
                  <span className="px-8 font-serif text-[17px] italic text-stone-500">{a}</span>
                  <Sparkle className="h-3 w-3 fill-stone-300 text-stone-300" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── How it works ─── */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <p className="text-[11px] font-bold tracking-[0.32em] text-gold-600">HOW DAIL JUSTICE WORKS</p>
        <h2 className="mt-4 max-w-xl font-serif text-[38px] leading-tight text-stone-900">
          From <em className="text-stone-400">"I need a lawyer"</em> to advice — in under an hour.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-8 transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-[0_18px_44px_-24px_rgba(23,20,18,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 transition group-hover:bg-stone-200">
                <s.icon className="h-5.5 w-5.5 text-stone-900" strokeWidth={1.9} />
              </div>
              <p className="mt-6 text-[10px] font-bold tracking-[0.3em] text-stone-400">{s.step}</p>
              <h3 className="mt-2 font-serif text-[22px] font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-stone-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured lawyers ─── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.32em] text-gold-600">FEATURED ADVOCATES</p>
            <h2 className="mt-4 font-serif text-[38px] leading-tight text-stone-900">
              The counsel clients <em className="text-stone-400">rebook.</em>
            </h2>
          </div>
          <button
            onClick={() => onNavigate("lawyers")}
            className="group flex items-center gap-2 text-[13px] font-bold text-stone-900 transition hover:text-stone-600"
          >
            View all 8 advocates
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {topThree.map((l) => (
            <LawyerCard key={l.id} lawyer={l} onBook={onBook} onView={() => onNavigate("lawyers")} />
          ))}
        </div>
      </section>

      {/* ─── Vault strip ─── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white p-10 lg:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
                <FolderLock className="h-5.5 w-5.5 text-stone-900" strokeWidth={1.9} />
              </div>
              <h3 className="mt-6 font-serif text-[32px] leading-tight text-stone-900">
                Your case papers live in a <em className="text-stone-400">vault</em>, not your inbox.
              </h3>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-stone-500">
                Upload agreements, notices and evidence to your encrypted document vault. Delete
                them — or your entire profile — any time. No questions, no traces.
              </p>
              <button
                onClick={() => onNavigate("dashboard", "documents")}
                className="mt-7 flex items-center gap-2 rounded-full border border-stone-900 px-6 py-3.5 text-[13px] font-bold text-stone-900 transition hover:bg-stone-900 hover:text-white"
              >
                Open my vault
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, t: "Private by default", d: "Stored in your own secure vault" },
                { icon: Video, t: "Encrypted consults", d: "Video rooms with mic/cam control" },
                { icon: Bot, t: "Lexi 24/7", d: "Instant answers to everyday legal questions" },
                { icon: Scale, t: "Bar-verified only", d: "Every advocate's licence is checked" },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <f.icon className="h-5 w-5 text-stone-900" />
                  <p className="mt-3 text-[13px] font-bold text-stone-900">{f.t}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-stone-500">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-grad">
              <Scale className="h-3.5 w-3.5 text-ink-950" strokeWidth={2.5} />
            </div>
            <p className="text-[12px] font-bold tracking-[0.2em] text-stone-800">DAIL JUSTICE</p>
          </div>
          <p className="text-center text-[11.5px] leading-relaxed text-stone-400">
            Dail Justice connects you with independent advocates. Lexi provides legal information,
            not legal advice.
          </p>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-stone-400">
            © 2026 · LEGAL, MADE HUMAN
          </p>
        </div>
      </footer>
    </div>
  );
}

export function LawyerCard({
  lawyer,
  onBook,
  onView,
}: {
  lawyer: Lawyer;
  onBook: (l: Lawyer) => void;
  onView?: (l: Lawyer) => void;
}) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-[0_20px_48px_-24px_rgba(23,20,18,0.25)]">
      <div className="relative h-60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-[#fbfaf7] to-stone-200/70 transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 flex items-center justify-center pb-14">
          <div className="relative">
            <div className="absolute -inset-3.5 rounded-full border border-stone-300/70" />
            <InitialsAvatar id={lawyer.id} name={lawyer.name} size={92} />
          </div>
        </div>
        <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/90 px-3 py-1 backdrop-blur">
          <BadgeCheck className="h-3 w-3 text-stone-900" />
          <span className="text-[9.5px] font-bold tracking-[0.14em] text-stone-700">BAR VERIFIED</span>
        </div>
        <div className="absolute bottom-3.5 left-4 right-4">
          <p className="font-serif text-[19px] font-semibold text-stone-900">{lawyer.name}</p>
          <p className="text-[11.5px] text-stone-500">{lawyer.areas[0]}</p>
        </div>
      </div>
      <div className="border-t border-stone-100 p-5">
        <div className="flex items-center justify-between text-[12px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
            <b className="text-stone-800">{lawyer.rating}</b> ({lawyer.reviews})
          </span>
          <span>{lawyer.experience} yrs exp.</span>
          <span className="font-serif text-[16px] font-semibold text-stone-900">{inr(lawyer.fee)}</span>
        </div>
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => onBook(lawyer)}
            className="flex-1 rounded-full bg-stone-900 py-2.5 text-[12px] font-bold text-white transition hover:bg-stone-800"
          >
            Book now
          </button>
          {onView && (
            <button
              onClick={() => onView(lawyer)}
              className="rounded-full border border-stone-300 px-4 py-2.5 text-[12px] font-bold text-stone-700 transition hover:border-stone-900"
            >
              Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
