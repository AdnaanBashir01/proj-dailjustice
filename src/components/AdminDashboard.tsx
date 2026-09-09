import { useCallback, useEffect, useState } from "react";
import {
  Scale,
  Users,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  FolderLock,
  BadgeCheck,
  Trash2,
  LogOut,
  Loader2,
  ShieldCheck,
  Video,
  Phone,
  Building2,
  MapPin,
  Star,
  File,
  FileImage,
  FileText,
  Download,
  Eye,
  BellRing,
  KeyRound,
  Save,
} from "lucide-react";
import {
  getAdminStats,
  listAllUsers,
  listAllBookingsGlobal,
  listCustomLawyers,
  listAllDocsGlobal,
  listAllNotificationsGlobal,
  getDocPayload,
  deleteCustomLawyer,
  deleteBooking,
  deleteUserCascade,
  removeDoc,
  updateUser,
  isAdminEmail,
  inr,
  fmtBytes,
  type AdminStats,
  type AppNotice,
  type Booking,
  type DocFile,
  type User,
} from "../lib/db";
import { LAWYERS, lawyerById, type Lawyer } from "../data/lawyers";
import InitialsAvatar from "./InitialsAvatar";
import { openPreview } from "./Documents";

interface Props {
  user: User;
  dbMode: "neon" | "local";
  notify: (msg: string, kind?: "ok" | "err") => void;
  onLogout: () => void;
}

type Tab = "users" | "bookings" | "advocates" | "documents" | "activity";
const TYPE_ICON = { video: Video, phone: Phone, person: Building2 };

const ago = (ts: number) => {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function AdminDashboard({ user, dbMode, notify, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customs, setCustoms] = useState<Lawyer[]>([]);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [activity, setActivity] = useState<AppNotice[]>([]);
  const [armed, setArmed] = useState<string | null>(null); // id pending delete-confirm
  const [busy, setBusy] = useState<string | null>(null);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [secBusy, setSecBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [s, u, b, c, dd, nn] = await Promise.all([
        getAdminStats(),
        listAllUsers(),
        listAllBookingsGlobal(),
        listCustomLawyers(),
        listAllDocsGlobal(),
        listAllNotificationsGlobal(),
      ]);
      setStats(s);
      setUsers(u);
      setBookings(b);
      setCustoms(c);
      setDocs(dd);
      setActivity(nn);
    } catch {
      notify("Could not load admin data.", "err");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reload();
  }, [reload]);

  const userById = (id: string) => users.find((u) => u.id === id);
  const lawyerByAnyId = (id: string): Lawyer | undefined =>
    lawyerById(id) ?? customs.find((c) => c.id === id);

  const removeUser = async (u: User) => {
    setBusy(u.id);
    try {
      await deleteUserCascade(u.id);
      setArmed(null);
      notify(`${u.name} and all their data were deleted.`);
      await reload();
    } catch {
      notify("Delete failed — database unreachable.", "err");
    } finally {
      setBusy(null);
    }
  };

  const removeLawyer = async (l: Lawyer) => {
    setBusy(l.id);
    try {
      await deleteCustomLawyer(l.id);
      setArmed(null);
      notify(`${l.name} removed from the roster.`);
      await reload();
    } catch {
      notify("Delete failed — database unreachable.", "err");
    } finally {
      setBusy(null);
    }
  };

  const removeBooking = async (b: Booking) => {
    setBusy(b.id);
    try {
      await deleteBooking(b.id);
      setArmed(null);
      notify("Booking record deleted from the platform.");
      await reload();
    } catch {
      notify("Delete failed — database unreachable.", "err");
    } finally {
      setBusy(null);
    }
  };

  const removeDocAdmin = async (d: DocFile) => {
    setBusy(d.id);
    try {
      await removeDoc(d.id);
      setArmed(null);
      notify(`"${d.name}" deleted by admin.`);
      await reload();
    } catch {
      notify("Delete failed — database unreachable.", "err");
    } finally {
      setBusy(null);
    }
  };

  const previewDoc = async (d: DocFile) => {
    setBusy(d.id);
    try {
      const dataUrl = await getDocPayload(d.id);
      if (!dataUrl) return notify("File payload not found.", "err");
      if (!openPreview({ ...d, dataUrl })) {
        notify("Preview blocked — allow pop-ups for this site.", "err");
      }
    } finally {
      setBusy(null);
    }
  };

  const downloadDoc = async (d: DocFile) => {
    setBusy(d.id);
    try {
      const dataUrl = await getDocPayload(d.id);
      if (!dataUrl) return notify("File payload not found.", "err");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = d.name;
      a.click();
    } finally {
      setBusy(null);
    }
  };

  /** Self-service admin password change — the clean handover path */
  const changeAdminPassword = async () => {
    if (oldPass !== user.password) {
      notify("Current password is incorrect.", "err");
      return;
    }
    if (newPass.length < 4) {
      notify("New password must be at least 4 characters.", "err");
      return;
    }
    setSecBusy(true);
    try {
      await updateUser({ ...user, password: newPass });
      setOldPass("");
      setNewPass("");
      notify("Console password updated — share it with the new admin for handover.");
    } catch {
      notify("Could not update password — database unreachable.", "err");
    } finally {
      setSecBusy(false);
    }
  };

  const statCards = stats
    ? [
        { icon: Users, label: "Registered users", value: String(stats.users) },
        { icon: Scale, label: "Advocates on roster", value: String(LAWYERS.length + stats.customAdvocates) },
        { icon: CalendarClock, label: "Total bookings", value: String(stats.bookings) },
        { icon: CheckCircle2, label: "Completed sessions", value: String(stats.completed) },
        { icon: IndianRupee, label: "Consultation revenue", value: inr(stats.revenue) },
        { icon: FolderLock, label: "Vault documents", value: String(stats.docs) },
      ]
    : [];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "users", label: "Users", count: users.length },
    { id: "bookings", label: "Bookings", count: bookings.length },
    { id: "advocates", label: "Advocates", count: LAWYERS.length + customs.length },
    { id: "documents", label: "Documents", count: docs.length },
    { id: "activity", label: "Activity", count: activity.length },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      {/* ─── Admin header ─── */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f7f5f0]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-grad">
              <Scale className="h-4 w-4 text-ink-950" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[12.5px] font-extrabold leading-none tracking-[0.18em] text-stone-900">
                DAIL JUSTICE
              </p>
              <p className="mt-1 text-[8.5px] font-bold leading-none tracking-[0.3em] text-gold-600">
                ADMIN CONSOLE
              </p>
            </div>
            <span className="ml-3 hidden items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[9px] font-extrabold tracking-[0.14em] text-stone-600 sm:flex">
              <ShieldCheck className="h-3 w-3" />
              {dbMode === "neon" ? "NEON LIVE · FULL ACCESS" : "LOCAL VAULT · FULL ACCESS"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-[12px] font-extrabold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-[11.5px] font-bold text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 lg:px-8">
        <p className="text-[11px] font-bold tracking-[0.32em] text-gold-600">MISSION CONTROL</p>
        <h1 className="mt-3 font-serif text-[38px] leading-tight text-stone-900">
          Platform <em className="text-stone-400">at a glance.</em>
        </h1>

        {loading ? (
          <div className="mt-14 flex items-center justify-center gap-3 py-20 text-[13px] font-semibold text-stone-500">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-stone-900" />
            Aggregating platform data…
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className="rounded-3xl border border-stone-200 bg-white p-5 transition hover:border-stone-400"
                >
                  <s.icon className="h-5 w-5 text-stone-900" strokeWidth={1.9} />
                  <p className="mt-3 font-serif text-[24px] font-semibold text-stone-900">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* ─── Admin security / handover panel ─── */}
            <div className="mt-8 flex flex-wrap items-center gap-5 rounded-3xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900">
                  <KeyRound className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <p className="font-serif text-[17px] font-semibold text-stone-900">Admin security</p>
                  <p className="max-w-[300px] text-[11px] leading-relaxed text-stone-500">
                    Hand over the portal by setting a fresh password here — the new admin logs in
                    with it and rotates it the same way.
                  </p>
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-40 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[12.5px] text-stone-900 outline-none transition focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    New password
                  </label>
                  <input
                    type="password"
                    placeholder="Requires 8+ chars • 1 uppercase"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-52 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[12.5px] text-stone-900 placeholder:text-[10.5px] outline-none transition focus:border-stone-900"
                  />
                </div>
                <button
                  onClick={changeAdminPassword}
                  disabled={secBusy}
                  className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
                >
                  {secBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Update password
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-10 flex gap-2 overflow-x-auto border-b border-stone-200">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setArmed(null);
                  }}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-[13px] font-bold transition ${
                    tab === t.id ? "text-stone-900" : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      tab === t.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {t.count}
                  </span>
                  {tab === t.id && (
                    <span className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-stone-900" />
                  )}
                </button>
              ))}
            </div>

            {/* ─── Users tab ─── */}
            {tab === "users" && (
              <div className="mt-7 space-y-3">
                {users.length === 0 && (
                  <p className="rounded-3xl border border-dashed border-stone-300 bg-white/70 py-14 text-center text-[13px] text-stone-500">
                    No registered users yet.
                  </p>
                )}
                {users.map((u) => {
                  const theirBookings = bookings.filter((b) => b.userId === u.id).length;
                  const isAdmin = isAdminEmail(u.email);
                  return (
                    <div
                      key={u.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400"
                    >
                      <InitialsAvatar id={u.id} name={u.name} size={46} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[14px] font-bold text-stone-900">
                          {u.name}
                          {isAdmin && (
                            <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-widest text-white">
                              ADMIN
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[12px] text-stone-500">{u.email}</p>
                      </div>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[10.5px] font-bold text-stone-500">
                        {theirBookings} booking{theirBookings !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-400">
                        Joined{" "}
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {!isAdmin &&
                        (armed === u.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeUser(u)}
                              disabled={busy === u.id}
                              className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-red-400 disabled:opacity-60"
                            >
                              {busy === u.id && <Loader2 className="h-3 w-3 animate-spin" />}
                              Delete
                            </button>
                            <button
                              onClick={() => setArmed(null)}
                              className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold text-stone-500"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setArmed(u.id)}
                            className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-[11px] font-bold text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Bookings tab ─── */}
            {tab === "bookings" && (
              <div className="mt-7 space-y-3">
                {bookings.length === 0 && (
                  <p className="rounded-3xl border border-dashed border-stone-300 bg-white/70 py-14 text-center text-[13px] text-stone-500">
                    No bookings across the platform yet.
                  </p>
                )}
                {bookings.map((b) => {
                  const l = lawyerByAnyId(b.lawyerId);
                  const c = userById(b.userId);
                  const Icon = TYPE_ICON[b.type];
                  return (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400"
                    >
                      <InitialsAvatar id={b.lawyerId} name={l?.name ?? "?"} size={46} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[14px] font-bold text-stone-900">
                          {l?.name ?? "Unknown advocate"}
                          <BadgeCheck className="h-4 w-4 text-stone-400" />
                        </p>
                        <p className="truncate text-[12px] text-stone-500">
                          Client: <b className="text-stone-700">{c?.name ?? "deleted user"}</b>
                          {c?.email ? ` · ${c.email}` : ""}
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10.5px] font-bold text-stone-600">
                        <Icon className="h-3 w-3" />
                        {b.type === "video" ? "VIDEO" : b.type === "phone" ? "PHONE" : "IN PERSON"}
                      </span>
                      <span className="text-[11.5px] font-semibold text-stone-500">
                        {new Date(b.date + "T00:00:00").toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" · "}
                        {b.time}
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
                      <span className="font-serif text-[15px] font-bold text-stone-900">
                        {inr(b.fee)}
                      </span>
                      {armed === b.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeBooking(b)}
                            disabled={busy === b.id}
                            className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-red-400 disabled:opacity-60"
                          >
                            {busy === b.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Delete
                          </button>
                          <button
                            onClick={() => setArmed(null)}
                            className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold text-stone-500"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setArmed(b.id)}
                          className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-[11px] font-bold text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Advocates tab ─── */}
            {tab === "advocates" && (
              <div className="mt-7 space-y-3">
                {[...customs, ...LAWYERS].map((l) => {
                  const custom = l.id.startsWith("cx-");
                  return (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400"
                    >
                      <InitialsAvatar id={l.id} name={l.name} size={46} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[14px] font-bold text-stone-900">
                          {l.name}
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-widest ${
                              custom ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            {custom ? "CUSTOM" : "CORE"}
                          </span>
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-stone-500">
                          <span>{l.areas[0]}</span>
                          <span className="text-stone-300">·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {l.city}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                            {l.rating} ({l.reviews})
                          </span>
                          <span className="text-stone-300">·</span>
                          <span>{l.mode}</span>
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-400">
                        {l.experience} yrs
                      </span>
                      <span className="font-serif text-[15px] font-bold text-stone-900">
                        {inr(l.fee)}
                      </span>
                      {custom &&
                        (armed === l.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeLawyer(l)}
                              disabled={busy === l.id}
                              className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-red-400 disabled:opacity-60"
                            >
                              {busy === l.id && <Loader2 className="h-3 w-3 animate-spin" />}
                              Delete
                            </button>
                            <button
                              onClick={() => setArmed(null)}
                              className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold text-stone-500"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setArmed(l.id)}
                            className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-[11px] font-bold text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Documents tab (all uploads, platform-wide) ─── */}
            {tab === "documents" && (
              <div className="mt-7 space-y-3">
                {docs.length === 0 && (
                  <p className="rounded-3xl border border-dashed border-stone-300 bg-white/70 py-14 text-center text-[13px] text-stone-500">
                    No documents uploaded anywhere on the platform yet.
                  </p>
                )}
                {docs.map((d) => {
                  const owner = userById(d.userId);
                  const isImg = d.mime.startsWith("image/");
                  const canPreview = isImg || d.mime.includes("pdf");
                  const Icon = isImg ? FileImage : d.mime.includes("pdf") ? FileText : File;
                  return (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100">
                        <Icon className="h-5 w-5 text-stone-500" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-stone-900" title={d.name}>
                          {d.name}
                        </p>
                        <p className="truncate text-[11.5px] text-stone-500">
                          Owner: <b className="text-stone-700">{owner?.name ?? "deleted user"}</b>
                          {owner?.email ? ` · ${owner.email}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-stone-500">
                        {d.name.split(".").pop()?.slice(0, 5)}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-400">{fmtBytes(d.size)}</span>
                      <span className="text-[11px] font-semibold text-stone-400">
                        {new Date(d.uploadedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {canPreview && (
                        <button
                          onClick={() => previewDoc(d)}
                          disabled={busy === d.id}
                          className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold text-stone-600 transition hover:border-stone-900 disabled:opacity-50"
                        >
                          {busy === d.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() => downloadDoc(d)}
                        disabled={busy === d.id}
                        className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold text-stone-600 transition hover:border-stone-900 disabled:opacity-50"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {armed === d.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeDocAdmin(d)}
                            disabled={busy === d.id}
                            className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-red-400 disabled:opacity-60"
                          >
                            {busy === d.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Delete
                          </button>
                          <button
                            onClick={() => setArmed(null)}
                            className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold text-stone-500"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setArmed(d.id)}
                          className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-[11px] font-bold text-red-500 transition hover:bg-red-50"
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Activity tab (all notification events) ─── */}
            {tab === "activity" && (
              <div className="mt-7 space-y-3">
                {activity.length === 0 && (
                  <p className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-stone-300 bg-white/70 py-14 text-center text-[13px] text-stone-500">
                    <BellRing className="h-7 w-7 text-stone-300" />
                    No platform activity yet — events appear here in real time.
                  </p>
                )}
                {activity.map((n) => {
                  const owner = userById(n.userId);
                  return (
                    <div
                      key={n.id}
                      className="flex gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.readAt === 0 ? "bg-gold-500" : "bg-stone-200"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-white">
                            {n.tag}
                          </span>
                          <span className="text-[9.5px] font-semibold text-stone-400">
                            {ago(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] font-bold text-stone-800">{n.title}</p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-stone-500">{n.body}</p>
                        <p className="mt-1.5 text-[10.5px] font-semibold text-stone-400">
                          For: <span className="text-stone-600">{owner?.name ?? "deleted user"}</span>
                          {owner?.email ? ` · ${owner.email}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
