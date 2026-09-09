import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Database,
  UserRound,
} from "lucide-react";
import type { User } from "../lib/store";

export interface AppNotification {
  id: string;
  tag: string;
  title: string;
  body: string;
  createdAt: number;
  readAt: number;
}

interface Props {
  title: string;
  theme: "light" | "dark";
  user: User;
  dbMode: "neon" | "local";
  notifications?: AppNotification[];
  onMarkAllRead?: () => void;
  onProfile: () => void;
  onLogout: () => void;
  onOpenMobileNav: () => void;
}

export default function TopBar({
  title,
  theme,
  user,
  dbMode,
  notifications = [],
  onMarkAllRead,
  onProfile,
  onLogout,
  onOpenMobileNav,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const light = theme === "light";
  const unread = notifications.filter((n) => n.readAt === 0).length;

  const ago = (ts: number) => {
    const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        light ? "border-stone-200/80 bg-[#f7f5f0]/85" : "border-gold-500/10 bg-ink-950/85"
      }`}
    >
      <div className="flex h-[64px] items-center justify-between px-5 lg:px-9">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileNav}
            className={`rounded-lg border p-2 lg:hidden ${
              light ? "border-stone-300 text-stone-600" : "border-gold-500/20 text-stone-300"
            }`}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em]">
            <span className={light ? "text-stone-400" : "text-gold-500/80"}>DAIL JUSTICE</span>
            <ChevronRight className={`h-3.5 w-3.5 ${light ? "text-stone-300" : "text-stone-600"}`} />
            <span className={light ? "text-stone-800" : "text-stone-200"}>{title}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3.5">
          {/* DB mode */}
          <span
            title={dbMode === "neon" ? "Connected to Neon Postgres" : "Local vault mode"}
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-extrabold tracking-[0.14em] md:flex ${
              dbMode === "neon"
                ? light
                  ? "border-stone-300 bg-white text-stone-700"
                  : "border-white/15 bg-white/5 text-stone-300"
                : light
                  ? "border-gold-600/30 bg-gold-500/10 text-gold-700"
                  : "border-gold-500/25 bg-gold-500/5 text-gold-400"
            }`}
          >
            <Database className="h-3 w-3" />
            {dbMode === "neon" ? "NEON LIVE" : "LOCAL VAULT"}
          </span>

          {/* Bell + notifications dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              title="Notifications"
              onClick={() => setBellOpen((v) => !v)}
              className={`relative rounded-full border p-2.5 transition ${
                light
                  ? "border-stone-200 bg-white text-stone-500 hover:text-stone-800"
                  : "border-gold-500/15 bg-ink-900 text-stone-400 hover:text-gold-300"
              }`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-stone-900 px-1 text-[9px] font-extrabold text-white">
                  {unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[21rem] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_28px_70px_-20px_rgba(23,20,18,0.4)] anim-fade-up">
                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
                  <p className="text-[13px] font-extrabold text-stone-900">
                    Notifications
                    {unread > 0 && (
                      <span className="ml-2 rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unread} new
                      </span>
                    )}
                  </p>
                  {unread > 0 && onMarkAllRead && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[10.5px] font-bold text-stone-400 underline underline-offset-2 transition hover:text-stone-900"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[12.5px] text-stone-400">
                      You're all caught up. ⚖️
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-stone-100 px-5 py-3.5 transition last:border-0 hover:bg-stone-50 ${
                          n.readAt === 0 ? "" : "opacity-55"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.readAt === 0 ? "bg-gold-500" : "bg-stone-200"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-white">
                              {n.tag}
                            </span>
                            <span className="text-[9.5px] font-semibold text-stone-400">
                              {ago(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[12.5px] font-bold text-stone-800">{n.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-stone-500">{n.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 transition ${
                light
                  ? "border-stone-200 bg-white hover:border-gold-600/40"
                  : "border-gold-500/20 bg-ink-900 hover:border-gold-500/40"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-[12px] font-extrabold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span
                className={`hidden max-w-[130px] truncate text-[13px] font-semibold sm:block ${
                  light ? "text-stone-800" : "text-stone-100"
                }`}
              >
                {user.name}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${menuOpen ? "rotate-180" : ""} ${
                  light ? "text-stone-400" : "text-stone-500"
                }`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl border border-gold-500/20 bg-ink-900 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] anim-fade-up">
                <div className="border-b border-gold-500/10 px-5 py-4">
                  <p className="truncate text-sm font-bold text-stone-100">{user.name}</p>
                  <p className="truncate text-xs text-stone-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    onProfile();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-[13px] font-medium text-stone-300 transition hover:bg-gold-500/5 hover:text-gold-300"
                >
                  <UserRound className="h-4 w-4 text-gold-500" />
                  Profile &amp; settings
                </button>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 border-t border-gold-500/10 px-5 py-3 text-[13px] font-medium text-red-400 transition hover:bg-red-500/5"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
