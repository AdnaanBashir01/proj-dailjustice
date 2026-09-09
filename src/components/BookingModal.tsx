import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Crown,
  Phone,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import {
  CONSULT_LABEL,
  TIME_SLOTS,
  feeFor,
  inr,
  isSlotTaken,
  nextDays,
  type ConsultType,
  type Lawyer,
} from "../lib/lawyerUtils";
import { addBooking, uid, type Booking } from "../lib/db";
import InitialsAvatar from "./InitialsAvatar";

interface Props {
  lawyer: Lawyer;
  userId: string;
  onClose: () => void;
  onDone: () => void;
}

const TYPES: { id: ConsultType; icon: typeof Video; label: string; note: string }[] = [
  { id: "video", icon: Video, label: "Video", note: "Secure in-app room" },
  { id: "phone", icon: Phone, label: "Phone", note: "20% cheaper" },
  { id: "person", icon: Building2, label: "In person", note: "At the chamber" },
];

export default function BookingModal({ lawyer, userId, onClose, onDone }: Props) {
  const days = useMemo(() => nextDays(14), []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [type, setType] = useState<ConsultType>("video");
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState("");
  const [placing, setPlacing] = useState(false);

  const fee = feeFor(lawyer, type);
  const chosen = days.find((d) => d.iso === date);

  const confirm = async () => {
    if (!date || !slot || placing) return;
    setPlacing(true);
    try {
      const booking: Booking = {
        id: uid(),
        userId,
        lawyerId: lawyer.id,
        date,
        time: slot,
        type,
        notes: notes.trim(),
        fee,
        status: "upcoming",
        createdAt: Date.now(),
      };
      await addBooking(booking);
      setCode(`DJ-${booking.id.slice(0, 6).toUpperCase()}`);
      setStep(3);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/55 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-[26px] bg-white p-7 anim-fade-up sm:rounded-[26px] sm:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <InitialsAvatar id={lawyer.id} name={lawyer.name} size={56} />
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.22em] text-gold-600">
                BOOK CONSULTATION <BadgeCheck className="h-3 w-3" />
              </p>
              <h3 className="mt-1 font-serif text-[21px] font-semibold text-stone-900">
                {lawyer.name}
              </h3>
              <p className="text-[12px] text-stone-400">{lawyer.areas[0]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-stone-200 p-2 text-stone-400 transition hover:border-stone-300 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="mt-6 flex items-center gap-2">
            {["Schedule", "Details"].map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    step > i ? "bg-stone-900 text-white" : "border border-stone-300 text-stone-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    step > i ? "text-stone-900" : "text-stone-400"
                  }`}
                >
                  {s}
                </span>
                <div className="mx-2 h-px flex-1 bg-stone-200" />
              </div>
            ))}
          </div>
        )}

        {/* ─── Step 1 · Schedule ─── */}
        {step === 1 && (
          <div className="mt-7">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Choose a date
            </p>
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-2">
              {days.map((d) => (
                <button
                  key={d.iso}
                  onClick={() => setDate(d.iso)}
                  className={`flex w-[68px] shrink-0 flex-col items-center rounded-2xl border py-3.5 transition ${
                    date === d.iso
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase ${date === d.iso ? "text-ink-950/70" : "text-stone-400"}`}>
                    {d.dow}
                  </span>
                  <span className="mt-1 font-serif text-[20px] font-bold">{d.day}</span>
                  <span className={`text-[10px] font-semibold ${date === d.iso ? "text-ink-950/70" : "text-stone-400"}`}>
                    {d.month}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Choose a time slot
            </p>
            {!date && (
              <p className="mt-3 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-[12.5px] text-stone-400">
                Pick a date above to see available slots.
              </p>
            )}
            {date && (
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {TIME_SLOTS.map((s) => {
                  const taken = isSlotTaken(lawyer.id, date, s);
                  return (
                    <button
                      key={s}
                      disabled={taken}
                      onClick={() => setSlot(s)}
                      className={`rounded-xl border py-2.5 text-[11.5px] font-bold transition ${
                        taken
                          ? "cursor-not-allowed border-stone-200 text-stone-300 line-through"
                          : slot === s
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              disabled={!date || !slot}
              onClick={() => setStep(2)}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[14px] font-bold text-white transition enabled:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Continue to details
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* ─── Step 2 · Details ─── */}
        {step === 2 && (
          <div className="mt-7">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Consultation format
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 transition ${
                    type === t.id
                      ? "border-stone-900 bg-stone-100 text-stone-900"
                      : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-400"
                  }`}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="text-[12px] font-bold">{t.label}</span>
                  <span className="text-[10px] text-stone-400">{t.note}</span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Brief for your advocate <span className="normal-case text-stone-400">(optional)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. My landlord has withheld my ₹60,000 deposit for 4 months despite repeated requests…"
              className="mt-3 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-[13.5px] text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-gold-500"
            />

            {/* Summary */}
            <div className="mt-5 space-y-2.5 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-[13px]">
              <div className="flex justify-between text-stone-500">
                <span>Advocate</span>
                <span className="font-semibold text-stone-800">{lawyer.name}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Schedule</span>
                <span className="font-semibold text-stone-800">
                  {chosen?.dow}, {chosen?.day} {chosen?.month} · {slot}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Format</span>
                <span className="font-semibold text-stone-800">{CONSULT_LABEL[type]}</span>
              </div>
              <div className="my-2 h-px bg-stone-200" />
              <div className="flex justify-between">
                  <span className="text-stone-500">Total payable</span>
                  <span className="font-serif text-[19px] font-bold text-stone-900">{inr(fee)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-stone-300 px-6 py-4 text-[13px] font-bold text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={confirm}
                disabled={placing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[14px] font-bold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-70"
              >
                {placing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                    Saving to database…
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Confirm booking · {inr(fee)}
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
              Free cancellation anytime before the session starts.
            </p>
          </div>
        )}

        {/* ─── Step 3 · Success ─── */}
        {step === 3 && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
              <CheckCircle2 className="h-9 w-9 text-stone-900" strokeWidth={1.8} />
            </div>
            <h4 className="mt-6 font-serif text-[28px] font-semibold text-stone-900">
              Consultation booked.
            </h4>
            <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-stone-500">
              {lawyer.name} has been notified and will receive your brief. Your confirmation code is
            </p>
            <p className="mt-3 inline-block rounded-xl border border-stone-300 bg-stone-50 px-5 py-2.5 font-mono text-[15px] font-bold tracking-[0.2em] text-stone-900">
              {code}
            </p>
            <div className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-left text-[13px]">
              <div className="flex justify-between text-stone-500">
                <span>When</span>
                <span className="font-semibold text-stone-800">
                  {chosen?.dow}, {chosen?.day} {chosen?.month} · {slot}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Format</span>
                <span className="font-semibold text-stone-800">{CONSULT_LABEL[type]}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Fee</span>
                <span className="font-semibold text-stone-900">{inr(fee)}</span>
              </div>
            </div>
            <div className="mt-7 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-stone-300 py-3.5 text-[13px] font-bold text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
              >
                Keep exploring
              </button>
              <button
                onClick={onDone}
                className="flex-1 rounded-xl bg-stone-900 py-3.5 text-[13px] font-bold text-white transition hover:bg-stone-800"
              >
                View my bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
