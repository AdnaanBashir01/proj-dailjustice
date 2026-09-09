import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  GraduationCap,
  Heart,
  Languages,
  ListFilter,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkle,
  Star,
  Trophy,
  Video,
  X,
  Zap,
} from "lucide-react";
import {
  LAWYERS,
  PRACTICE_AREAS,
  inr,
  isAvailableToday,
  type Lawyer,
} from "../lib/lawyerUtils";
import { addCustomLawyer, listCustomLawyers } from "../lib/db";
import InitialsAvatar, { paletteFor } from "./InitialsAvatar";

interface Props {
  onBook: (lawyer: Lawyer) => void;
  onLawyerAdded?: (lawyer: Lawyer) => void;
}

const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "fee-asc", label: "Fee: low to high" },
  { id: "fee-desc", label: "Fee: high to low" },
  { id: "exp", label: "Most experienced" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const FAV_KEY = "dj_favs_v1";
const readFavs = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export default function Lawyers({ onBook, onLawyerAdded }: Props) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All practice areas");
  const [sort, setSort] = useState<SortId>("recommended");
  const [availOnly, setAvailOnly] = useState(false);
  const [detail, setDetail] = useState<Lawyer | null>(null);
  const [favs, setFavs] = useState<string[]>(readFavs);
  const [customs, setCustoms] = useState<Lawyer[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    listCustomLawyers()
      .then(setCustoms)
      .catch(() => undefined);
  }, []);

  const ALL = useMemo(() => [...customs, ...LAWYERS], [customs]);

  const handleAdded = (l: Lawyer) => {
    setCustoms((p) => [l, ...p]);
    setAddOpen(false);
    onLawyerAdded?.(l);
  };

  const toggleFav = (id: string) => {
    setFavs((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ALL.filter((l) => {
      const matchArea = area === "All practice areas" || l.areas.includes(area);
      const matchQ =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.areas.some((a) => a.toLowerCase().includes(q)) ||
        l.city.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q));
      const matchAvail = !availOnly || isAvailableToday(l.id);
      return matchArea && matchQ && matchAvail;
    });
    switch (sort) {
      case "fee-asc":
        return list.sort((a, b) => a.fee - b.fee);
      case "fee-desc":
        return list.sort((a, b) => b.fee - a.fee);
      case "exp":
        return list.sort((a, b) => b.experience - a.experience);
      default:
        return list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    }
  }, [query, area, sort, availOnly, ALL]);

  const selectCls =
    "flex items-center gap-2 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 py-3 text-[12.5px] font-semibold text-stone-600 outline-none transition hover:border-gold-600/40 focus:border-gold-500";

  return (
    <div className="min-h-full bg-[#f7f5f0]">
      <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-10 lg:px-9">
        {/* ─── Header ─── */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[10.5px] font-bold tracking-[0.32em] text-gold-600">
              CURATED FOR YOUR NEXT STEP
            </p>
            <h1 className="mt-3 font-serif text-[44px] leading-[1.05] text-stone-900">
              Find your legal match.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-stone-500">
              Verified expertise, transparent fees, and a conversation that starts on your terms.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-[12.5px] font-bold text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
            >
              <Plus className="h-4 w-4" />
              Add a lawyer
            </button>
            <div className="flex items-center gap-3">
              <p className="font-serif text-[48px] font-semibold leading-none text-gold-500">
                {String(filtered.length).padStart(2, "0")}
              </p>
              <p className="text-[11px] font-semibold leading-snug tracking-[0.14em] text-stone-500">
                SPECIALISTS
                <br />
                AVAILABLE
              </p>
            </div>
          </div>
        </div>

        {/* ─── Filter bar ─── */}
        <div className="mt-9 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_2px_14px_-6px_rgba(28,25,23,0.08)]">
          <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-xl px-3 py-1">
            <Search className="h-4.5 w-4.5 shrink-0 text-gold-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, practice, or keyword"
              className="w-full bg-transparent py-2.5 text-[13.5px] text-stone-800 placeholder:text-stone-400 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-stone-400 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={`${selectCls} appearance-none pl-9 pr-8`}
              >
                {["All practice areas", ...PRACTICE_AREAS].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            </div>

            <div className="relative">
              <ListFilter className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className={`${selectCls} appearance-none pl-9 pr-8`}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            </div>

            <button
              onClick={() => setAvailOnly((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[12.5px] font-bold transition ${
                availOnly
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-400 hover:text-stone-800"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${availOnly ? "bg-white" : "bg-stone-300"}`} />
              Available today
            </button>
          </div>
        </div>

        {/* ─── Cards grid ─── */}
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => {
            const available = isAvailableToday(l.id);
            const fav = favs.includes(l.id);
            const canVideo = l.mode !== "In-person";
            return (
              <div
                key={l.id}
                onClick={() => setDetail(l)}
                className="group cursor-pointer rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_2px_16px_-8px_rgba(28,25,23,0.10)] transition hover:-translate-y-0.5 hover:border-gold-500/60 hover:shadow-[0_18px_40px_-18px_rgba(168,132,62,0.35)]"
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <InitialsAvatar id={l.id} name={l.name} size={58} online={available} />
                    <div>
                      <p className="flex items-center gap-1.5 font-serif text-[18px] font-semibold text-stone-900">
                        {l.name.replace("Adv. ", "")}
                        <BadgeCheck className="h-4 w-4 fill-gold-100 text-gold-600" />
                        {l.id.startsWith("cx-") && (
                          <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-widest text-white">
                            NEW
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-stone-500">{l.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(l.id);
                    }}
                    className="rounded-full p-1.5 transition hover:bg-stone-100"
                    title="Save to favorites"
                  >
                    <Heart
                      className={`h-[18px] w-[18px] transition ${
                        fav ? "fill-gold-500 text-gold-500" : "text-stone-300 hover:text-gold-500"
                      }`}
                    />
                  </button>
                </div>

                {/* Meta */}
                <div className="mt-3.5 flex items-center gap-2 text-[12px] text-stone-500">
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    {l.rating}
                  </span>
                  <span className="text-stone-400">({l.reviews})</span>
                  <span className="text-stone-300">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {l.city}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span>{l.mode}</span>
                </div>

                <p className="mt-3.5 line-clamp-2 min-h-[40px] text-[13px] leading-relaxed text-stone-600">
                  {l.blurb}
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {l.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg border border-stone-200 bg-stone-100/80 px-3 py-1.5 text-[11px] font-semibold text-stone-600"
                    >
                      {t}
                    </span>
                  ))}
                  {canVideo && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-700">
                      <Video className="h-3 w-3 text-gold-600" />
                      Video consult
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-4">
                  <div>
                    <p className="text-[10.5px] font-medium uppercase tracking-wider text-stone-400">
                      30 min consultation
                    </p>
                    <p className="mt-1 font-serif text-[24px] font-bold leading-none text-stone-900">
                      {inr(l.fee)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBook(l);
                    }}
                    className="group/btn flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[12.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(23,20,18,0.55)] transition hover:bg-stone-800"
                  >
                    Book now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 rounded-3xl border border-dashed border-stone-300 bg-white/60 py-16 text-center">
            <p className="font-serif text-[22px] text-stone-700">No specialists match those filters.</p>
            <p className="mt-2 text-[13px] text-stone-500">
              Clear the search or pick a different practice area.
            </p>
          </div>
        )}
      </div>

      {/* ─── Profile modal (light) ─── */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[26px] bg-white anim-fade-up sm:rounded-[26px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid sm:grid-cols-[280px_1fr]">
              <div
                className="relative flex h-64 items-center justify-center overflow-hidden sm:h-full sm:min-h-[500px]"
                style={{
                  background: `linear-gradient(150deg, ${paletteFor(detail.id).bg} 0%, #17130f 130%)`,
                }}
              >
                {/* decorative rings */}
                <div className="absolute h-[280px] w-[280px] rounded-full border border-white/10" />
                <div className="absolute h-[190px] w-[190px] rounded-full border border-white/15" />
                <InitialsAvatar id={detail.id} name={detail.name} size={132} className="shadow-2xl" />
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 backdrop-blur">
                  <BadgeCheck className="h-3 w-3 text-gold-600" />
                  <span className="text-[9.5px] font-bold tracking-[0.14em] text-stone-700">
                    BAR COUNCIL VERIFIED
                  </span>
                </div>
                {isAvailableToday(detail.id) && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[10.5px] font-bold text-stone-900 shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                    AVAILABLE TODAY
                  </div>
                )}
              </div>

              <div className="relative p-7 sm:p-9">
                <button
                  onClick={() => setDetail(null)}
                  className="absolute right-5 top-5 rounded-full border border-stone-200 p-2 text-stone-400 transition hover:border-stone-300 hover:text-stone-700"
                >
                  <X className="h-4 w-4" />
                </button>

                <p className="text-[10px] font-bold tracking-[0.3em] text-gold-600">ADVOCATE PROFILE</p>
                <h3 className="mt-2 font-serif text-[30px] font-semibold text-stone-900">
                  {detail.name}
                </h3>
                <p className="mt-1 text-[13.5px] text-gold-700">{detail.title}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[...detail.areas, ...detail.tags].map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { icon: Star, v: `${detail.rating}`, l: `${detail.reviews} reviews` },
                    { icon: Trophy, v: `${detail.casesWon}+`, l: "matters won" },
                    { icon: Zap, v: detail.responseTime, l: "avg response" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-center">
                      <s.icon className="mx-auto h-4 w-4 text-gold-600" />
                      <p className="mt-2 font-serif text-[17px] font-semibold text-stone-900">{s.v}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-stone-400">{s.l}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-[13.5px] leading-relaxed text-stone-600">{detail.about}</p>

                <div className="mt-6 space-y-2.5 text-[12.5px] text-stone-500">
                  <p className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 shrink-0 text-gold-600" /> {detail.education}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 shrink-0 text-gold-600" /> {detail.courts}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Languages className="h-4 w-4 shrink-0 text-gold-600" /> {detail.languages.join(" · ")}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-gold-600" /> {detail.city} · {detail.experience} years in practice · {detail.mode}
                  </p>
                </div>

                <div className="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                      <Video className="h-3 w-3 text-emerald-600" /> Video consultation
                    </p>
                    <p className="mt-1 font-serif text-[24px] font-semibold text-stone-900">
                      {inr(detail.fee)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onBook(detail);
                      setDetail(null);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-[13px] font-bold text-white transition hover:bg-stone-800"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Book now
                  </button>
                </div>

                <p className="mt-4 flex items-center gap-2 text-[11px] text-stone-400">
                  <Sparkle className="h-3 w-3 fill-gold-500/50 text-gold-500" />
                  Fee includes a written summary &amp; next-steps note after your session.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add-a-lawyer modal ─── */}
      {addOpen && <AddLawyerModal onClose={() => setAddOpen(false)} onAdded={handleAdded} />}
    </div>
  );
}

// ─── Onboard a new advocate (writes to dj_lawyers / local vault) ─────────────

function AddLawyerModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (l: Lawyer) => void;
}) {
  const [name, setName] = useState("");
  const [area, setArea] = useState(PRACTICE_AREAS[0]);
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [fee, setFee] = useState("");
  const [mode, setMode] = useState<Lawyer["mode"]>("Online");
  const [blurb, setBlurb] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[13.5px] text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900";
  const labelCls =
    "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400";

  const save = async () => {
    if (name.trim().length < 3) return setError("Enter the advocate's full name.");
    if (city.trim().length < 2) return setError("Enter a city.");
    const expNum = parseInt(experience, 10);
    if (!expNum || expNum < 1 || expNum > 60)
      return setError("Experience must be between 1 and 60 years.");
    const feeNum = parseInt(fee, 10);
    if (!feeNum || feeNum < 500) return setError("Fee must be at least ₹500.");
    if (blurb.trim().length < 10) return setError("Write a one-line intro (10+ characters).");

    setBusy(true);
    setError("");
    try {
      const l = await addCustomLawyer({
        name,
        area,
        city,
        experience: expNum,
        fee: feeNum,
        mode,
        blurb,
      });
      onAdded(l);
    } catch {
      setError("Could not save — database unreachable. Try again.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/55 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-white p-7 anim-fade-up sm:rounded-[26px] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-gold-600">ADD TO THE ROSTER</p>
            <h3 className="mt-2 font-serif text-[26px] font-semibold text-stone-900">
              Onboard a new advocate.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-stone-200 p-2 text-stone-400 transition hover:border-stone-300 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              className={inputCls}
              placeholder="e.g. Rahul Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className={labelCls}>Practice area</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={`${inputCls} appearance-none pr-9`}
              >
                {PRACTICE_AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3.5 h-4 w-4 text-stone-400" />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input
                className={inputCls}
                placeholder="e.g. Jaipur"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Experience (years)</label>
              <input
                className={inputCls}
                placeholder="e.g. 8"
                inputMode="numeric"
                value={experience}
                onChange={(e) => setExperience(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className={labelCls}>Video fee (₹)</label>
              <input
                className={inputCls}
                placeholder="e.g. 1800"
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Consultation mode</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["Online", "In-person", "Online & In-person"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-xl border px-2 py-2.5 text-[11.5px] font-bold transition ${
                    mode === m
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-400"
                  }`}
                >
                  {m === "In-person" ? "In person" : m === "Online" ? "Online" : "Both"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>One-line intro</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="e.g. Tenacious bail specialist with 300+ urgent hearings argued."
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[14px] font-bold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving to database…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add advocate to roster
              </>
            )}
          </button>
          <p className="text-center text-[10.5px] text-stone-400">
            Appears in the list instantly · stored in the dj_lawyers table
          </p>
        </div>
      </div>
    </div>
  );
}
