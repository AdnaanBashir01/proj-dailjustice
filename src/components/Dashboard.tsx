import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  FolderLock,
  Phone,
  Building2,
  UserRound,
  Video,
  XCircle,
  ArrowRight,
  IndianRupee,
  Loader2,
} from "lucide-react";
import {
  listBookings,
  listDocs,
  listCustomLawyers,
  updateBookingStatus,
  inr,
  type Booking,
  type User,
} from "../lib/db";
import { lawyerById, type Lawyer } from "../data/lawyers";
import Documents from "./Documents";
import Profile from "./Profile";
import InitialsAvatar from "./InitialsAvatar";

interface Props {
  user: User;
  initialTab: "bookings" | "documents" | "profile";
  dbMode: "neon" | "local";
  onJoinCall: (booking: Booking) => void;
  onBrowseLawyers: () => void;
  notify: (msg: string, kind?: "ok" | "err") => void;
  onDeleted: () => void;
  onUserUpdated: (u: User) => void;
}

const TYPE_ICON = { video: Video, phone: Phone, person: Building2 };

export default function Dashboard({
  user,
  initialTab,
  dbMode,
  onJoinCall,
  onBrowseLawyers,
  notify,
  onDeleted,
  onUserUpdated,
}: Props) {
  const [tab, setTab] = useState(initialTab);
  const [tick, setTick] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [customLawyers, setCustomLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setTab(initialTab), [initialTab]);

  const refresh = useCallback(async () => {
    try {
      const [b, d, c] = await Promise.all([
        listBookings(user.id),
        listDocs(user.id),
        listCustomLawyers(),
      ]);
      setBookings(b);
      setDocCount(d.length);
      setCustomLawyers(c);
    } catch {
      notify("Could not load your records from the database.", "err");
    } finally {
      setLoading(false);
    }
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh, tick, tab]);

  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const completed = bookings.filter((b) => b.status === "completed");
  const spent = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.fee, 0);

  const cancel = async (id: string) => {
    setBusyId(id);
    try {
      await updateBookingStatus(id, "cancelled");
      setConfirmCancel(null);
      setTick((t) => t + 1);
      notify("Booking cancelled. You can re-book any slot.");
    } catch {
      notify("Could not cancel — database unreachable.", "err");
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: "bookings" as const, label: "My Bookings", icon: CalendarClock },
    { id: "documents" as const, label: "Documents", icon: FolderLock },
    { id: "profile" as const, label: "Profile & Settings", icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 lg:px-8">
        <p className="text-[11px] font-bold tracking-[0.32em] text-gold-600">YOUR PRIVATE CHAMBER</p>
        <h1 className="mt-4 font-serif text-[40px] leading-tight text-stone-900">
          Good to see you, <em className="text-stone-400">{user.name.split(" ")[0]}.</em>
        </h1>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: CalendarClock, label: "Upcoming", value: String(upcoming.length) },
            { icon: CheckCircle2, label: "Completed", value: String(completed.length) },
            { icon: FolderLock, label: "Vault documents", value: String(docCount) },
            { icon: IndianRupee, label: "Invested in advice", value: inr(spent) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-stone-200 bg-white p-5 transition hover:border-stone-400"
            >
              <s.icon className="h-5 w-5 text-stone-900" strokeWidth={1.9} />
              <p className="mt-3 font-serif text-[26px] font-semibold text-stone-900">{s.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-10 flex gap-2 overflow-x-auto border-b border-stone-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-[13px] font-bold transition ${
                tab === t.id ? "text-stone-900" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-stone-900" />
              )}
            </button>
          ))}
        </div>

        {/* ─── Bookings tab ─── */}
        {tab === "bookings" && (
          <div className="mt-8">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-3xl border border-stone-200 bg-white py-20 text-[13px] font-semibold text-stone-500">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-stone-900" />
                Fetching your records from the {dbMode === "neon" ? "Neon database" : "vault"}…
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 px-8 py-20 text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-stone-300" strokeWidth={1.4} />
                <p className="mt-5 font-serif text-[24px] text-stone-900">No consultations yet.</p>
                <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-stone-500">
                  Your first session with a verified advocate is one click away — video, phone or in
                  person.
                </p>
                <button
                  onClick={onBrowseLawyers}
                  className="group mx-auto mt-7 flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3.5 text-[13px] font-bold text-white transition hover:bg-stone-800"
                >
                  Find a lawyer
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => {
                  const lawyer =
                    lawyerById(b.lawyerId) ?? customLawyers.find((c) => c.id === b.lawyerId);
                  if (!lawyer) return null;
                  const Icon = TYPE_ICON[b.type];
                  const dateLabel = new Date(b.date + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={b.id}
                      className={`flex flex-col gap-5 rounded-3xl border bg-white p-5 transition sm:flex-row sm:items-center ${
                        b.status === "upcoming"
                          ? "border-stone-300 shadow-[0_10px_30px_-18px_rgba(23,20,18,0.18)]"
                          : "border-stone-200 opacity-80"
                      }`}
                    >
                      <InitialsAvatar id={lawyer.id} name={lawyer.name} size={64} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-serif text-[18px] font-semibold text-stone-900">
                            {lawyer.name}
                          </p>
                          <BadgeCheck className="h-4 w-4 text-stone-400" />
                        </div>
                        <p className="mt-0.5 text-[12px] text-stone-500">
                          {lawyer.areas[0]} · {dateLabel} · {b.time}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10.5px] font-bold text-stone-600">
                            <Icon className="h-3 w-3" />
                            {b.type === "video" ? "VIDEO" : b.type === "phone" ? "PHONE" : "IN PERSON"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${
                              b.status === "upcoming"
                                ? "bg-stone-900 text-white"
                                : b.status === "completed"
                                  ? "bg-stone-100 text-stone-500"
                                  : "bg-red-50 text-red-500"
                            }`}
                          >
                            {b.status.toUpperCase()}
                          </span>
                          <span className="text-[12px] font-semibold text-stone-500">{inr(b.fee)}</span>
                        </div>
                      </div>

                      {b.status === "upcoming" && (
                        <div className="flex shrink-0 items-center gap-2.5">
                          {b.type === "video" && (
                            <button
                              onClick={() => onJoinCall(b)}
                              className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[12px] font-bold text-white transition hover:bg-stone-800"
                            >
                              <Video className="h-4 w-4" />
                              Join video call
                            </button>
                          )}
                          {confirmCancel === b.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => cancel(b.id)}
                                disabled={busyId === b.id}
                                className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-3 text-[12px] font-bold text-white transition hover:bg-red-400 disabled:opacity-60"
                              >
                                {busyId === b.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmCancel(null)}
                                className="rounded-full border border-stone-300 px-4 py-3 text-[12px] font-bold text-stone-500 transition hover:border-stone-400"
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmCancel(b.id)}
                              className="flex items-center gap-1.5 rounded-full border border-red-200 px-5 py-3 text-[12px] font-bold text-red-500 transition hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Documents tab ─── */}
        {tab === "documents" && (
          <div className="mt-8">
            <Documents user={user} dbMode={dbMode} notify={notify} onChange={refresh} />
          </div>
        )}

        {/* ─── Profile tab ─── */}
        {tab === "profile" && (
          <div className="mt-8">
            <Profile
              user={user}
              dbMode={dbMode}
              notify={notify}
              onDeleted={onDeleted}
              onUserUpdated={onUserUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
}
