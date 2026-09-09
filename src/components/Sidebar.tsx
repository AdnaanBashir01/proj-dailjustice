import {
  Scale,
  LayoutGrid,
  Search,
  CalendarClock,
  MessageSquareText,
  FolderLock,
  Sparkles,
  X,
} from "lucide-react";

interface Props {
  view: string;
  dashTab: string;
  bookingsCount: number;
  onNavigate: (view: "home" | "lawyers" | "dashboard", tab?: "bookings" | "documents" | "profile") => void;
  onOpenChat: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  view,
  dashTab,
  bookingsCount,
  onNavigate,
  onOpenChat,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const items = [
    {
      key: "overview",
      label: "Overview",
      icon: LayoutGrid,
      active: view === "home",
      action: () => onNavigate("home"),
    },
    {
      key: "lawyers",
      label: "Find a lawyer",
      icon: Search,
      active: view === "lawyers",
      action: () => onNavigate("lawyers"),
    },
    {
      key: "bookings",
      label: "My bookings",
      icon: CalendarClock,
      active: view === "dashboard" && dashTab === "bookings",
      badge: bookingsCount > 0 ? bookingsCount : undefined,
      action: () => onNavigate("dashboard", "bookings"),
    },
    {
      key: "messages",
      label: "Messages",
      icon: MessageSquareText,
      chip: "AI",
      action: onOpenChat,
    },
    {
      key: "documents",
      label: "Documents",
      icon: FolderLock,
      active: view === "dashboard" && dashTab === "documents",
      action: () => onNavigate("dashboard", "documents"),
    },
  ];

  const go = (fn: () => void) => {
    fn();
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-ink-950/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[56] flex w-[248px] flex-col border-r border-gold-500/10 bg-ink-950 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 pb-6 pt-7">
          <button onClick={() => go(() => onNavigate("home"))} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-grad shadow-[0_8px_26px_-8px_rgba(201,164,92,0.7)]">
              <Scale className="h-4.5 w-4.5 text-ink-950" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[13.5px] font-extrabold leading-none tracking-[0.18em] text-stone-100">
                DAIL JUSTICE
              </p>
              <p className="mt-1.5 text-[8px] font-bold leading-none tracking-[0.3em] text-gold-500">
                LEGAL, MADE HUMAN
              </p>
            </div>
          </button>
          <button onClick={onCloseMobile} className="text-stone-500 hover:text-stone-200 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <p className="px-7 pb-3 text-[10px] font-bold tracking-[0.3em] text-stone-600">
          YOUR SPACE
        </p>
        <nav className="flex-1 space-y-1 px-4">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.action)}
              className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-[13.5px] font-semibold transition ${
                item.active
                  ? "bg-white/[0.08] text-white"
                  : "text-stone-400 hover:bg-white/[0.04] hover:text-stone-100"
              }`}
            >
              <item.icon
                className={`h-[17px] w-[17px] ${item.active ? "text-white" : "text-stone-500 group-hover:text-stone-300"}`}
                strokeWidth={2}
              />
              {item.label}
              {item.badge !== undefined && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-extrabold text-ink-950">
                  {item.badge}
                </span>
              )}
              {item.chip && (
                <span className="ml-auto rounded-md border border-white/15 px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-widest text-stone-400">
                  {item.chip}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Lexi promo */}
        <div className="p-4">
          <button
            onClick={() => go(onOpenChat)}
            className="group w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-grad">
                <Sparkles className="h-3.5 w-3.5 text-ink-950" fill="currentColor" />
              </div>
              <p className="text-[13px] font-bold text-stone-100">Ask Lexi</p>
              <span className="ml-auto flex h-2 w-2">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              Legal doubts at 2 AM? Your AI concierge answers instantly.
            </p>
          </button>
        </div>
      </aside>
    </>
  );
}
