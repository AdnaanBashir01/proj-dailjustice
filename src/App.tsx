import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Scale, Database } from "lucide-react";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import TopBar, { type AppNotification } from "./components/TopBar";
import Home from "./components/Home";
import Lawyers from "./components/Lawyers";
import Dashboard from "./components/Dashboard";
import BookingModal from "./components/BookingModal";
import VideoCall from "./components/VideoCall";
import Chatbot from "./components/Chatbot";
import AdminDashboard from "./components/AdminDashboard";
import {
  initDb,
  getDbMode,
  getUserById,
  getSessionId,
  clearSession,
  listBookings,
  listCustomLawyers,
  listNotifications,
  markAllNotificationsRead,
  addNotification,
  ensureAdmin,
  isAdminEmail,
  type Booking,
  type User,
} from "./lib/db";
import { isNeonConfigured } from "./lib/dbConfig";
import { LAWYERS, type Lawyer } from "./data/lawyers";

type View = "home" | "lawyers" | "dashboard";
type DashTab = "bookings" | "documents" | "profile";

interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "err";
}

let toastId = 0;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booted, setBooted] = useState(false);
  const [dbMode, setDbMode] = useState<"neon" | "local">(
    isNeonConfigured() ? "neon" : "local"
  );
  const [view, setView] = useState<View>("home");
  const [dashTab, setDashTab] = useState<DashTab>("bookings");
  const [dashKey, setDashKey] = useState(0);
  const [bookingFor, setBookingFor] = useState<Lawyer | null>(null);
  const [callBooking, setCallBooking] = useState<Booking | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [extraLawyers, setExtraLawyers] = useState<Lawyer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ─── Boot: connect DB + restore session ───
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await Promise.all([
          (async () => {
            await initDb();
            await ensureAdmin();
            const sid = getSessionId();
            if (sid) {
              const u = await getUserById(sid);
              if (!u) clearSession();
              if (alive) setUser(u);
            }
          })(),
          delay(750),
        ]);
      } catch (e) {
        console.error("[Dail Justice] boot failed", e);
      } finally {
        if (alive) {
          setDbMode(getDbMode());
          setBooted(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ─── Real notifications: DB events + "due soon" reminders ───
  const loadNotifs = useCallback(async () => {
    if (!user) {
      setUpcomingCount(0);
      setNotifications([]);
      return;
    }
    try {
      const [notices, bs] = await Promise.all([
        listNotifications(user.id),
        listBookings(user.id),
      ]);
      const upcoming = bs.filter((b) => b.status === "upcoming");
      setUpcomingCount(upcoming.length);

      const reminders: AppNotification[] = upcoming
        .map((b) => {
          const dayDiff = Math.floor(
            (new Date(b.date + "T00:00:00").getTime() - Date.now()) / 86400000
          );
          if (dayDiff > 1 || dayDiff < 0) return null;
          const l = resolveLawyer(b.lawyerId);
          return {
            id: `rem-${b.id}`,
            tag: "REMINDER",
            title: `Consultation ${dayDiff === 0 ? "today" : "tomorrow"} · ${b.time}`,
            body: `${l?.name ?? "Your advocate"} — ${b.type === "video" ? "join the video room from My Bookings a few minutes early." : "keep your phone nearby around the slot."}`,
            createdAt: Date.now() - 1000,
            readAt: 0,
          } as AppNotification;
        })
        .filter((n): n is AppNotification => n !== null);

      setNotifications([...reminders, ...notices]);
    } catch {
      /* keep old state */
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadNotifs();
    const poll = window.setInterval(loadNotifs, 15000);
    return () => window.clearInterval(poll);
  }, [loadNotifs, view, dashKey, chatOpen]);

  // ─── Custom advocates added via "Add a lawyer" ───
  useEffect(() => {
    if (!user) return;
    listCustomLawyers()
      .then(setExtraLawyers)
      .catch(() => undefined);
  }, [user, dashKey]);

  const resolveLawyer = (id: string): Lawyer | undefined =>
    LAWYERS.find((l) => l.id === id) ?? extraLawyers.find((l) => l.id === id);

  const notify = (msg: string, kind: "ok" | "err" = "ok") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };

  const navigate = (v: View, tab?: DashTab) => {
    setView(v);
    if (v === "dashboard") setDashTab(tab ?? "bookings");
    window.scrollTo({ top: 0 });
  };

  const openBooking = (lawyerOrId: Lawyer | string) => {
    const l = typeof lawyerOrId === "string" ? resolveLawyer(lawyerOrId) : lawyerOrId;
    if (l) setBookingFor(l);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setView("home");
    notify("Logged out. Your data stays safe in the database.");
  };

  // ─── Splash ───
  if (!booted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-grad gold-ring anim-fade-up">
          <Scale className="h-7 w-7 text-ink-950" strokeWidth={2.4} />
        </div>
        <p className="mt-6 text-[15px] font-bold tracking-[0.3em] text-stone-100 anim-fade-up-1">
          DAIL JUSTICE
        </p>
        <p className="mt-1.5 text-[10px] font-semibold tracking-[0.34em] text-gold-500 anim-fade-up-1">
          LEGAL, MADE HUMAN
        </p>
        <div className="mt-8 flex items-center gap-1.5 anim-fade-up-2">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold-400" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold-400" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold-400" />
        </div>
        <p className="mt-4 text-[11.5px] font-medium tracking-wide text-stone-500 anim-fade-up-2">
          {isNeonConfigured()
            ? "Connecting to your Neon Postgres database…"
            : "Opening the secure vault…"}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.22em] text-stone-600 anim-fade-up-3">
          <Database className="h-3 w-3" />
          {isNeonConfigured()
            ? "SERVERLESS POSTGRES · HTTP DRIVER"
            : "LOCAL MODE · PASTE YOUR NEON STRING IN src/lib/dbConfig.ts"}
        </p>
      </div>
    );
  }

  // ─── Unauthenticated ───
  if (!user) {
    return (
      <>
        <Auth
          onAuth={(u) => {
            setUser(u);
            notify(`Welcome, ${u.name.split(" ")[0]}. Your legal journey starts here.`);
          }}
        />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  // ─── Admin console (separate experience) ───
  if (isAdminEmail(user.email)) {
    return (
      <>
        <AdminDashboard user={user} dbMode={dbMode} notify={notify} onLogout={logout} />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  const callLawyer = callBooking ? resolveLawyer(callBooking.lawyerId) : null;

  const crumb =
    view === "lawyers"
      ? "FIND A LAWYER"
      : view === "home"
        ? "OVERVIEW"
        : dashTab === "bookings"
          ? "MY BOOKINGS"
          : dashTab === "documents"
            ? "DOCUMENTS"
            : "PROFILE & SETTINGS";

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <Sidebar
        view={view}
        dashTab={dashTab}
        bookingsCount={upcomingCount}
        onNavigate={navigate}
        onOpenChat={() => setChatOpen(true)}
        mobileOpen={navOpen}
        onCloseMobile={() => setNavOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <TopBar
          title={crumb}
          theme="light"
          user={user}
          dbMode={dbMode}
          notifications={notifications}
          onMarkAllRead={() => {
            void markAllNotificationsRead(user.id).then(loadNotifs);
          }}
          onProfile={() => navigate("dashboard", "profile")}
          onLogout={logout}
          onOpenMobileNav={() => setNavOpen(true)}
        />

        <main className="flex-1">
          {view === "home" && (
            <Home
              onNavigate={navigate}
              onBook={openBooking}
              onOpenChat={() => setChatOpen(true)}
            />
          )}

          {view === "lawyers" && (
            <Lawyers
              onBook={openBooking}
              onLawyerAdded={(l) => {
                setExtraLawyers((p) => [l, ...p]);
                void addNotification(
                  user.id,
                  "ROSTER",
                  "Advocate added to roster",
                  `${l.name} · ${l.areas[0]} · ${l.city} is now bookable at your quoted fee.`
                );
                void loadNotifs();
                notify(`${l.name} joined the roster — ready to book.`);
              }}
            />
          )}

          {view === "dashboard" && (
            <Dashboard
              key={`${dashKey}-${dashTab}`}
              user={user}
              initialTab={dashTab}
              dbMode={dbMode}
              onJoinCall={(b) => setCallBooking(b)}
              onBrowseLawyers={() => navigate("lawyers")}
              notify={notify}
              onDeleted={() => {
                setUser(null);
                setView("home");
                notify("Your profile, bookings and vault were permanently deleted.");
              }}
              onUserUpdated={(u) => setUser(u)}
            />
          )}
        </main>
      </div>

      {/* Lexi concierge */}
      <Chatbot
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        userName={user.name}
        onBook={openBooking}
        onNavigate={(v, tab) => navigate(v, tab)}
      />

      {/* Booking flow */}
      {bookingFor && (
        <BookingModal
          lawyer={bookingFor}
          userId={user.id}
          onClose={() => setBookingFor(null)}
          onDone={() => {
            const l = bookingFor;
            setBookingFor(null);
            setDashKey((k) => k + 1);
            navigate("dashboard", "bookings");
            if (l) {
              void addNotification(
                user.id,
                "BOOKING",
                "Consultation booked",
                `${l.name} has received your brief. Join from My Bookings when it's time.`
              );
            }
            void loadNotifs();
            notify("Booking confirmed — saved to the database.");
          }}
        />
      )}

      {/* Video consultation room */}
      {callBooking && callLawyer && (
        <VideoCall
          booking={callBooking}
          lawyer={callLawyer}
          onEnd={() => {
            setCallBooking(null);
            setDashKey((k) => k + 1);
            notify("Consultation ended — booking marked as completed.");
          }}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-full border px-5 py-3 text-[13px] font-semibold shadow-[0_16px_44px_-12px_rgba(0,0,0,0.8)] backdrop-blur anim-fade-up ${
            t.kind === "err"
              ? "border-red-500/40 bg-red-950/90 text-red-200"
              : "border-gold-500/35 bg-ink-900/95 text-gold-200"
          }`}
        >
          {t.kind === "err" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
