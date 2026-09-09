import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Video,
  VideoOff,
  UserRound,
  ReceiptIndianRupee,
} from "lucide-react";
import { updateBookingStatus, addNotification, inr, type Booking } from "../lib/db";
import { type Lawyer } from "../data/lawyers";
import InitialsAvatar from "./InitialsAvatar";

interface Props {
  booking: Booking;
  lawyer: Lawyer;
  onEnd: () => void;
}

export default function VideoCall({ booking, lawyer, onEnd }: Props) {
  const localRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [denied, setDenied] = useState(false);
  const [live, setLive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Local camera — real getUserMedia
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
      })
      .catch(() => setDenied(true));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // "Lawyer joins" after a beat
  useEffect(() => {
    const t = setTimeout(() => setLive(true), 2800);
    return () => clearTimeout(t);
  }, []);

  // Call timer
  useEffect(() => {
    if (!live) return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [live]);

  const toggleMic = () => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  const hangUp = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    // persist completion in the database, then leave the room
    updateBookingStatus(booking.id, "completed").catch(() => undefined);
    addNotification(
      booking.userId,
      "COMPLETED",
      "Consultation completed",
      `Your session with ${lawyer.name} has ended. A summary note is attached to this booking.`
    ).catch(() => undefined);
    onEnd();
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const dateLabel = new Date(booking.date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      {/* ─── Remote feed (lawyer) ─── */}
      <div className="relative flex-1 overflow-hidden">
        {live ? (
          /* ─── Advocate presence panel (avatar view, no remote video) ─── */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-ink-900 via-ink-950 to-black anim-fade-up">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/[0.02] blur-3xl" />
            <div className="relative">
              <span className="absolute -inset-6 animate-pulse rounded-full border border-white/10" />
              <span className="absolute -inset-12 rounded-full border border-white/5" />
              <InitialsAvatar
                id={lawyer.id}
                name={lawyer.name}
                size={140}
                className="border-2 border-white/15"
              />
            </div>
            <p className="mt-8 font-serif text-[26px] font-semibold text-stone-100">
              {lawyer.name}
            </p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.28em] text-stone-500">
              {lawyer.areas[0]}
            </p>
            <div className="mt-6 flex items-center gap-2.5 rounded-full bg-white/5 px-5 py-2.5">
              <span className="flex items-end gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-gold-400 anim-rec"
                    style={{
                      height: `${8 + (i % 3) * 4}px`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </span>
              <span className="text-[11px] font-bold text-stone-300">
                Advocate connected · audio only
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950">
            <div className="relative">
              <InitialsAvatar
                id={lawyer.id}
                name={lawyer.name}
                size={128}
                className="border-2 border-gold-500/50"
              />
              <span className="absolute inset-0 animate-ping rounded-full border-2 border-gold-500/40" />
            </div>
            <p className="mt-8 font-serif text-[22px] text-stone-200">Connecting secure line…</p>
            <p className="mt-2 flex items-center gap-2 text-[12px] text-stone-500">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
              Verifying encryption · {lawyer.name.split(" ")[1] ?? ""} is joining
            </p>
          </div>
        )}

        {/* gradient legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

        {/* ─── Top bar ─── */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-[10.5px] font-bold tracking-[0.18em] text-gold-300 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              ENCRYPTED
            </span>
            {live && (
              <span className="hidden items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-[11px] font-bold text-stone-200 backdrop-blur sm:flex">
                <span className="h-2 w-2 rounded-full bg-red-500 anim-rec" />
                {mm}:{ss}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold text-stone-100">{lawyer.name}</p>
            <p className="text-[10.5px] text-stone-400">
              {lawyer.areas[0]} · {dateLabel} · {booking.time}
            </p>
          </div>
        </div>

        {/* ─── Nameplate ─── */}
        {live && (
          <div className="absolute bottom-28 left-5 flex items-center gap-2.5 rounded-2xl bg-black/55 px-4 py-2.5 backdrop-blur sm:left-8">
            <InitialsAvatar id={lawyer.id} name={lawyer.name} size={32} />
            <div>
              <p className="text-[12px] font-bold text-stone-100">{lawyer.name}</p>
              <p className="text-[10px] text-emerald-400">Speaking · HD</p>
            </div>
          </div>
        )}

        {/* ─── Local PiP ─── */}
        <div className="absolute bottom-28 right-5 w-40 overflow-hidden rounded-2xl border border-gold-500/30 shadow-2xl sm:right-8 sm:w-56">
          <div className="relative aspect-video bg-ink-900">
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition ${
                !camOn || denied ? "opacity-0" : "opacity-100"
              }`}
            />
            {(!camOn || denied) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <UserRound className="h-6 w-6 text-stone-500" />
                <p className="text-[10px] font-semibold text-stone-500">
                  {denied ? "Camera unavailable" : "Camera off"}
                </p>
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[9.5px] font-bold text-stone-200">
              You
            </span>
            {!micOn && (
              <span className="absolute right-2 top-2 rounded-md bg-red-500/90 p-1">
                <MicOff className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Control bar ─── */}
      <div className="relative z-10 flex flex-col items-center gap-3 bg-black/85 px-5 py-5 backdrop-blur">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMic}
            className={`flex h-13 w-13 items-center justify-center rounded-full border transition ${
              micOn
                ? "border-gold-500/30 bg-ink-800 text-stone-100 hover:border-gold-400"
                : "border-red-500/50 bg-red-500/15 text-red-400"
            }`}
            title={micOn ? "Mute microphone" : "Unmute microphone"}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleCam}
            className={`flex h-13 w-13 items-center justify-center rounded-full border transition ${
              camOn && !denied
                ? "border-gold-500/30 bg-ink-800 text-stone-100 hover:border-gold-400"
                : "border-red-500/50 bg-red-500/15 text-red-400"
            }`}
            title={camOn ? "Turn camera off" : "Turn camera on"}
          >
            {camOn && !denied ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={hangUp}
            className="flex h-13 items-center gap-2.5 rounded-full bg-red-500 px-7 text-[13.5px] font-bold text-white shadow-[0_10px_36px_-10px_rgba(239,68,68,0.8)] transition hover:bg-red-400"
          >
            <PhoneOff className="h-5 w-5" />
            End consultation
          </button>

          <span className="hidden items-center gap-2 rounded-full border border-gold-500/20 px-4 py-2.5 text-[11px] font-bold text-gold-300 sm:flex">
            <ReceiptIndianRupee className="h-4 w-4" />
            {inr(booking.fee)} session
          </span>
        </div>
        <p className="text-[10.5px] text-stone-600">
          Demo room — your camera feed never leaves this device. Ending the call marks the booking as completed.
        </p>
      </div>
    </div>
  );
}
