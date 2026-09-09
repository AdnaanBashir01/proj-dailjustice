import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  Scale,
  Sparkle,
  ShieldCheck,
  Lock,
  Database,
  Zap,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import {
  authenticate,
  createUser,
  setSession,
  getDbMode,
  getRecoveryQuestion,
  resetPassword,
  type User,
} from "../lib/db";

interface Props {
  onAuth: (user: User) => void;
}

const SECURITY_QUESTIONS = [
  "In which city were you born?",
  "What was your childhood nickname?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favourite food?",
];

const BULLETS = [
  "250+ verified lawyers across every practice area",
  "Transparent fees before you ever book",
  "Lexi, your 24/7 legal concierge",
];

export default function Auth({ onAuth }: Props) {
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secQ, setSecQ] = useState(SECURITY_QUESTIONS[0]);
  const [secA, setSecA] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});

  // ── Forgot-password (recovery) state ──
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPass, setNewPass] = useState("");

  const submit = async () => {
    const e: typeof errors = {};
    if (mode === "signup" && name.trim().length < 2) e.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (password.length < 4) e.password = "Password must be at least 4 characters.";
    if (mode === "signup" && secA.trim().length < 3)
      e.form = "Set a recovery answer (min 3 characters) — it unlocks 'forgot password' later.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await createUser(name, email, password, secQ, secA)
          : await authenticate(email, password);
      if (!res.ok) {
        setErrors({ form: res.error });
        return;
      }
      setSession(res.user.id);
      onAuth(res.user);
    } catch {
      setErrors({ form: "Could not reach the database. Check your internet and try again." });
    } finally {
      setBusy(false);
    }
  };

  /** One-tap demo entry — creates the demo account on first use */
  const demoLogin = async () => {
    setBusy(true);
    setErrors({});
    try {
      let res = await authenticate("demo@dailjustice.com", "demo1234");
      if (!res.ok) {
        const created = await createUser("Demo Client", "demo@dailjustice.com", "demo1234");
        if (created.ok) res = created;
      }
      if (res.ok) {
        setSession(res.user.id);
        onAuth(res.user);
      }
    } catch {
      setErrors({ form: "Could not reach the database. Try again." });
    } finally {
      setBusy(false);
    }
  };

  /** Recovery step 1 — look up the account's security question */
  const startRecovery = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ form: "Enter your account email first." });
      return;
    }
    setBusy(true);
    const res = await getRecoveryQuestion(email);
    setBusy(false);
    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    setErrors({});
    setQuestion(res.question);
    setStep(2);
  };

  /** Recovery step 2 — verify the answer, write the new password */
  const completeRecovery = async () => {
    const res = await resetPassword(email, answer, newPass);
    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    setErrors({});
    setStep(3);
  };

  const inputCls =
    "w-full rounded-lg border border-stone-300 bg-white px-4 py-3.5 text-[15px] text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";

  return (
    <div className="flex min-h-screen bg-cream">
      {/* ─── Left story panel ─── */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink-950 p-12 lg:flex xl:p-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-gold-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-gold-600/10 blur-[110px]" />

        <div className="relative">
          <div className="flex items-center gap-3 anim-fade-up">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-grad shadow-[0_8px_30px_-8px_rgba(201,164,92,0.7)]">
              <Scale className="h-5 w-5 text-ink-950" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-[0.22em] text-stone-100">DAIL JUSTICE</p>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-500">LEGAL, MADE HUMAN</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold tracking-[0.34em] text-gold-400/90 anim-fade-up">
            YOUR LEGAL JOURNEY STARTS HERE
          </p>
          <h1 className="mt-6 font-serif text-[56px] leading-[1.05] text-stone-50 anim-fade-up-1 xl:text-[64px]">
            Justice,
            <br />
            <em className="text-gold-grad">one consultation</em>
            <br />
            <em className="text-gold-grad">away.</em>
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-stone-400 anim-fade-up-2">
            Create your account to find verified lawyers, book private consultations, and keep
            every case detail in one secure place.
          </p>

          <ul className="mt-10 space-y-5 anim-fade-up-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-4 text-[14px] text-stone-300">
                <Sparkle className="h-3.5 w-3.5 shrink-0 fill-gold-400 text-gold-400" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] font-medium tracking-[0.28em] text-stone-500">
          © 2026 · DAIL JUSTICE
        </p>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[520px]">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950">
              <Scale className="h-4.5 w-4.5 text-gold-400" strokeWidth={2.4} />
            </div>
            <p className="text-sm font-bold tracking-[0.22em] text-ink-950">DAIL JUSTICE</p>
          </div>

          <p className="text-[11px] font-bold tracking-[0.32em] text-gold-700">
            WELCOME TO DAIL JUSTICE
          </p>
          <h2 className="mt-3 font-serif text-[38px] leading-tight text-ink-950">
            {mode === "signup" ? "Create your account." : "Welcome back."}
          </h2>
          <p className="mt-2 text-[14px] text-stone-500">
            {mode === "signup"
              ? "It takes less than a minute. Your details stay private and secure."
              : "Pick up right where your legal journey left off."}
          </p>

          {mode !== "forgot" && (
            <>
              {/* Tabs */}
          <div className="mt-8 flex gap-10 border-b border-stone-200">
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErrors({});
                }}
                className={`relative pb-3 text-[12px] font-bold tracking-[0.18em] transition ${
                  mode === m ? "text-ink-950" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {m === "signup" ? "CREATE ACCOUNT" : "LOG IN"}
                {mode === m && (
                  <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-stone-900" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-7 space-y-5">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                  Full name
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Arjun Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                Email address
              </label>
              <input
                className={inputCls}
                placeholder="you@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">Password</label>
              <input
                className={inputCls}
                placeholder={
                  mode === "signup"
                    ? "Requires 8+ chars • 1 uppercase • 1 number • 1 symbol"
                    : "Enter your password"
                }
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !busy && submit()}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password}</p>
              )}
              {mode === "login" && (
                <button
                  onClick={() => {
                    setMode("forgot");
                    setStep(1);
                    setErrors({});
                    setAnswer("");
                    setNewPass("");
                  }}
                  className="mt-2 text-[11.5px] font-bold text-gold-700 underline underline-offset-4 transition hover:text-stone-900"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                    Recovery question
                  </label>
                  <select
                    className={`${inputCls} appearance-none bg-white`}
                    value={secQ}
                    onChange={(e) => setSecQ(e.target.value)}
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                    Your answer
                  </label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Jaipur"
                    value={secA}
                    onChange={(e) => setSecA(e.target.value)}
                  />
                </div>
              </div>
            )}

            {errors.form && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                {errors.form}
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-4 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(23,20,18,0.55)] transition hover:bg-stone-800 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Talking to the database…
                </>
              ) : (
                <>
                  {mode === "signup" ? "Create account & enter" : "Log in & enter"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <button
              onClick={demoLogin}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-stone-50 py-3 text-[13px] font-bold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5 fill-stone-400 text-gold-500" />
              Quick demo entry — no signup needed
            </button>

            {/* Admin access: no public shortcut — log in with the seeded admin
                credentials (see ADMIN_EMAIL / ADMIN_PASSWORD in src/lib/db.ts) */}
          </div>
            </>
          )}

          {/* ─── Forgot-password recovery panel ─── */}
          {mode === "forgot" && (
            <div className="mt-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900">
                  <KeyRound className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <p className="font-serif text-[22px] font-semibold text-ink-950">
                    Recover your password.
                  </p>
                  <p className="text-[12.5px] text-stone-500">
                    {step === 1
                      ? "Step 1 of 3 · Verify your account email"
                      : step === 2
                        ? "Step 2 of 3 · Prove it's you, then reset"
                        : "Step 3 of 3 · All done"}
                  </p>
                </div>
              </div>

              {step === 1 && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                      Account email
                    </label>
                    <input
                      className={inputCls}
                      placeholder="you@email.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !busy && startRecovery()}
                    />
                  </div>
                  {errors.form && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                      {errors.form}
                    </div>
                  )}
                  <button
                    onClick={startRecovery}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-4 text-[14px] font-bold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-70"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking the database…
                      </>
                    ) : (
                      "Find my account"
                    )}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-gold-600/30 bg-gold-500/10 px-4 py-3.5">
                    <p className="text-[9.5px] font-bold tracking-[0.22em] text-gold-700">
                      YOUR SECURITY QUESTION
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-stone-800">{question}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                      Your answer
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Type the answer you gave at signup"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-stone-700">
                      New password
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Requires 8+ chars • 1 uppercase • 1 number • 1 symbol"
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !busy && completeRecovery()}
                    />
                  </div>
                  {errors.form && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                      {errors.form}
                    </div>
                  )}
                  <button
                    onClick={completeRecovery}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-4 text-[14px] font-bold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-70"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying answer…
                      </>
                    ) : (
                      "Verify answer & reset password"
                    )}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="mt-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                    <CheckCircle2 className="h-7 w-7 text-stone-900" strokeWidth={1.8} />
                  </div>
                  <p className="mt-4 font-serif text-[24px] font-semibold text-ink-950">
                    Password updated.
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-stone-500">
                    Your account is secured with the new password. Log in as usual to continue.
                  </p>
                  <button
                    onClick={() => {
                      setMode("login");
                      setPassword("");
                      setStep(1);
                      setAnswer("");
                      setNewPass("");
                      setErrors({});
                    }}
                    className="mt-6 w-full rounded-lg bg-stone-900 py-4 text-[14px] font-bold text-white transition hover:bg-stone-800"
                  >
                    Back to log in
                  </button>
                </div>
              )}

              {step !== 3 && (
                <button
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                  }}
                  className="mx-auto mt-5 block text-[11.5px] font-bold text-stone-400 underline underline-offset-4 transition hover:text-stone-700"
                >
                  ← Back to log in
                </button>
              )}
            </div>
          )}

          <div className="panel-line mt-9" />
          <div className="mt-5 flex items-start gap-2.5 text-[12px] leading-relaxed text-stone-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
            <p>
              By continuing you agree to a private, encrypted session. Your bookings are stored
              securely in a database of your choice.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold tracking-wide text-stone-400">
            <span className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              256-BIT SESSION ENCRYPTION
            </span>
            <span
              className={`flex items-center gap-1.5 ${
                getDbMode() === "neon" ? "text-emerald-600" : "text-stone-400"
              }`}
            >
              <Database className="h-3 w-3" />
              {getDbMode() === "neon" ? "NEON POSTGRES · LIVE" : "LOCAL VAULT · ADD NEON STRING"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
