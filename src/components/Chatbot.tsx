import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarCheck, RotateCcw, SendHorizonal, Sparkles, Star, X, Cpu, BrainCircuit } from "lucide-react";
import { INITIAL_CHIPS, lexiReply, type LexiNav } from "../lib/chatbot";
import { lawyerById, inr } from "../lib/lawyerUtils";
import { checkBackend, lexiChat } from "../lib/llm";
import InitialsAvatar from "./InitialsAvatar";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  chips?: string[];
  lawyerIds?: string[];
  nav?: LexiNav;
}

interface Props {
  open: boolean;
  onToggle: () => void;
  userName: string;
  onBook: (lawyerId: string) => void;
  onNavigate: (view: "home" | "lawyers" | "dashboard", tab?: "bookings" | "documents" | "profile") => void;
}

let mid = 1;

export default function Chatbot({ open, onToggle, userName, onBook, onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: `Hi ${userName.split(" ")[0]}, I'm Lexi — your 24/7 legal concierge.\n\nAsk me anything: "my landlord won't return my deposit", "I got a tax notice", or "explain bail". I can also book you with the right advocate directly.`,
      chips: INITIAL_CHIPS,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState(false);
  const [llmOnline, setLlmOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 1800);
    return () => clearTimeout(t);
  }, []);

  // Probe the backend server once — decides AI vs offline-engine badge
  useEffect(() => {
    let alive = true;
    checkBackend().then((up) => {
      if (alive) setLlmOnline(up);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput("");
    setTyping(true);

    const prior = messages;
    setMessages((m) => [...m, { id: mid++, from: "user", text }]);

    // Structured metadata from the rule engine (advocate cards / chips / nav)
    // — reused even when the LLM writes the prose (hybrid AI).
    const structured = lexiReply(text, { name: userName.split(" ")[0] });

    // ── Path A · REAL LLM via our backend server (primary) ──
    if (llmOnline) {
      const history = [
        ...prior.slice(-8).map((m) => ({
          role: (m.from === "bot" ? "assistant" : "user") as "assistant" | "user",
          content: m.text,
        })),
        { role: "user" as const, content: text },
      ];
      const ai = await lexiChat(history);
      if (ai !== null) {
        setMessages((m) => [
          ...m,
          {
            id: mid++,
            from: "bot",
            text: ai.text,
            chips:
              ai.followups.length > 0
                ? ai.followups
                : (structured.chips ?? ["Find me a lawyer", "How does booking work?", "Ask about something else"]),
            lawyerIds: structured.lawyerIds,
            nav: structured.nav,
          },
        ]);
        setTyping(false);
        return;
      }
      // Backend died mid-conversation → degrade gracefully this session
      setLlmOnline(false);
    }

    // ── Path B · offline rule-based engine (automatic failover) ──
    await new Promise((r) => setTimeout(r, 650));
    setMessages((m) => [
      ...m,
      {
        id: mid++,
        from: "bot",
        text: structured.text,
        chips: structured.chips,
        lawyerIds: structured.lawyerIds,
        nav: structured.nav,
      },
    ]);
    setTyping(false);
  };

  const reset = () => {
    setMessages([
      {
        id: 0,
        from: "bot",
        text: "Fresh start. What legal issue can I help you untangle?",
        chips: INITIAL_CHIPS,
      },
    ]);
  };

  const lastId = messages[messages.length - 1]?.id;

  return (
    <>
      {/* Hint bubble */}
      {!open && (
        <div
          className={`fixed bottom-[104px] right-5 z-[68] w-56 rounded-2xl rounded-br-sm border border-gold-500/25 bg-ink-900 p-4 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.85)] transition-all duration-500 ${
            hint ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          <button
            onClick={() => setHint(false)}
            className="absolute right-2 top-2 text-stone-500 hover:text-stone-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-[12px] font-bold text-gold-300">Lexi is online</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-stone-400">
            Got a legal question? I answer instantly — 24/7, free.
          </p>
        </div>
      )}

      {/* Floating toggle — "Ask Lexi" pill */}
      <button
        onClick={onToggle}
        className={`fixed bottom-6 right-5 z-[70] flex items-center gap-2.5 rounded-full border border-gold-500/40 bg-ink-950 py-3 shadow-[0_16px_44px_-12px_rgba(0,0,0,0.8)] transition hover:border-gold-400 hover:shadow-[0_16px_44px_-10px_rgba(201,164,92,0.45)] active:scale-95 ${
          open ? "px-3.5" : "px-5"
        }`}
        aria-label="Open Lexi chat"
      >
        {open ? (
          <X className="h-4.5 w-4.5 text-gold-400" />
        ) : (
          <>
            <Sparkles className="h-4.5 w-4.5 text-gold-400" fill="currentColor" />
            <span className="text-[13px] font-bold tracking-wide text-stone-100">Ask Lexi</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-[92px] right-4 z-[70] flex h-[min(76vh,620px)] w-[min(94vw,410px)] flex-col overflow-hidden rounded-[26px] border border-gold-500/25 bg-ink-900 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] anim-fade-up sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold-500/12 bg-ink-850 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold-grad">
                <Sparkles className="h-4.5 w-4.5 text-ink-950" fill="currentColor" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-850 bg-emerald-400" />
              </div>
              <div>
                <p className="text-[14.5px] font-extrabold tracking-wide text-stone-100">Lexi</p>
                <p
                  className={`flex items-center gap-1.5 text-[10.5px] font-semibold ${
                    llmOnline ? "text-emerald-400" : "text-gold-400"
                  }`}
                >
                  {llmOnline ? (
                    <>
                      <BrainCircuit className="h-3 w-3" />
                      AI-POWERED · GEMINI ONLINE
                    </>
                  ) : (
                    <>
                      <Cpu className="h-3 w-3" />
                      OFFLINE ENGINE · RULE-BASED NLU
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={reset}
                className="rounded-full p-2 text-stone-500 transition hover:bg-ink-700 hover:text-gold-300"
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={onToggle}
                className="rounded-full p-2 text-stone-500 transition hover:bg-ink-700 hover:text-gold-300"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] ${
                    m.from === "user"
                      ? "rounded-2xl rounded-br-sm bg-gold-500 px-4 py-3 text-ink-950"
                      : "rounded-2xl rounded-bl-sm border border-gold-500/12 bg-ink-800 px-4 py-3 text-stone-200"
                  }`}
                >
                  {m.text.split("\n").map((para, i) => (
                    <p
                      key={i}
                      className={`text-[13px] leading-relaxed ${i > 0 ? "mt-2" : ""} ${
                        m.from === "user" ? "font-semibold" : ""
                      }`}
                    >
                      {para}
                    </p>
                  ))}

                  {/* Lawyer recommendations */}
                  {m.lawyerIds && m.lawyerIds.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {m.lawyerIds.map((id) => {
                        const l = lawyerById(id);
                        if (!l) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-3 rounded-xl border border-gold-500/20 bg-ink-850 p-2.5"
                          >
                            <InitialsAvatar id={l.id} name={l.name} size={44} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-bold text-stone-100">{l.name}</p>
                              <p className="flex items-center gap-1.5 text-[10.5px] text-stone-500">
                                <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                                {l.rating} · {l.areas[0]} · {inr(l.fee)}
                              </p>
                            </div>
                            <button
                              onClick={() => onBook(l.id)}
                              className="flex shrink-0 items-center gap-1 rounded-full bg-gold-500 px-3.5 py-2 text-[10.5px] font-extrabold text-ink-950 transition hover:bg-gold-400"
                            >
                              <CalendarCheck className="h-3 w-3" />
                              Book
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation action */}
                  {m.nav && (
                    <button
                      onClick={() => onNavigate(m.nav!.view, m.nav!.tab)}
                      className="group mt-3 flex w-full items-center justify-between rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-2.5 text-[12px] font-bold text-gold-300 transition hover:bg-gold-500/12"
                    >
                      {m.nav.label}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}

                  {/* Suggestion chips on latest bot message */}
                  {m.from === "bot" && m.id === lastId && m.chips && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.chips.map((c) => (
                        <button
                          key={c}
                          onClick={() => send(c)}
                          className="rounded-full border border-gold-500/30 px-3 py-1.5 text-[11px] font-bold text-gold-300 transition hover:bg-gold-500 hover:text-ink-950"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-gold-500/12 bg-ink-800 px-4 py-3.5">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold-400" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold-400" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gold-500/12 bg-ink-850 p-3.5">
            <div className="flex items-center gap-2.5 rounded-full border border-gold-500/20 bg-ink-900 py-1.5 pl-5 pr-1.5 focus-within:border-gold-500/50">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Describe your legal issue…"
                className="w-full bg-transparent text-[13.5px] text-stone-100 placeholder:text-stone-600 outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || typing}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-ink-950 transition enabled:hover:bg-gold-400 disabled:opacity-30"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[9.5px] tracking-wide text-stone-600">
              Lexi gives legal information, not advice · For your case, consult an advocate
            </p>
          </div>
        </div>
      )}
    </>
  );
}
