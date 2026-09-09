import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Database,
  KeyRound,
  Loader2,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  countUsers,
  deleteUserCascade,
  updateUser,
  type User,
} from "../lib/db";

interface Props {
  user: User;
  dbMode: "neon" | "local";
  notify: (msg: string, kind?: "ok" | "err") => void;
  onDeleted: () => void;
  onUserUpdated: (u: User) => void;
}

export default function Profile({ user, dbMode, notify, onDeleted, onUserUpdated }: Props) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city ?? "");

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const [confirmText, setConfirmText] = useState("");
  const [armDelete, setArmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<number | null>(null);

  useEffect(() => {
    countUsers()
      .then(setAccounts)
      .catch(() => setAccounts(null));
  }, []);

  const inputCls =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[13.5px] text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900";

  const saveProfile = async () => {
    if (name.trim().length < 2) {
      notify("Name looks too short.", "err");
      return;
    }
    setBusy("profile");
    try {
      const updated = { ...user, name: name.trim(), phone: phone.trim(), city: city.trim() };
      await updateUser(updated);
      onUserUpdated(updated);
      notify("Profile updated in the database.");
    } catch {
      notify("Could not save — database unreachable.", "err");
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async () => {
    if (oldPass !== user.password) {
      notify("Current password is incorrect.", "err");
      return;
    }
    if (newPass.length < 4) {
      notify("New password must be at least 4 characters.", "err");
      return;
    }
    setBusy("password");
    try {
      const updated = { ...user, password: newPass };
      await updateUser(updated);
      onUserUpdated(updated);
      setOldPass("");
      setNewPass("");
      notify("Password changed successfully.");
    } catch {
      notify("Could not update password — database unreachable.", "err");
    } finally {
      setBusy(null);
    }
  };

  const destroy = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      notify('Type "DELETE" to confirm account deletion.', "err");
      return;
    }
    setBusy("delete");
    try {
      await deleteUserCascade(user.id);
      onDeleted();
    } catch {
      notify("Could not delete — database unreachable. Try again.", "err");
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ─── Identity ─── */}
      <div className="rounded-3xl border border-stone-200 bg-white p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900 font-serif text-[26px] font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="flex items-center gap-2 font-serif text-[21px] font-semibold text-stone-900">
              {user.name}
              <BadgeCheck className="h-4.5 w-4.5 text-gold-600" />
            </p>
            <p className="text-[12.5px] text-stone-500">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
              <UserRound className="h-3.5 w-3.5 text-stone-900" /> Full name
            </label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Email (login ID · locked)
            </label>
            <input
              className={`${inputCls} cursor-not-allowed opacity-50`}
              value={user.email}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
                Phone
              </label>
              <input
                className={inputCls}
                placeholder="+91 …"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
                City
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Pune"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={busy !== null}
            className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-[13px] font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {busy === "profile" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ─── Password ─── */}
        <div className="rounded-3xl border border-stone-200 bg-white p-7">
          <p className="flex items-center gap-2.5 font-serif text-[19px] font-semibold text-stone-900">
            <KeyRound className="h-5 w-5 text-stone-900" /> Security
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
                Current password
              </label>
              <input
                type="password"
                className={inputCls}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
                New password
              </label>
              <input
                type="password"
                className={inputCls}
                placeholder="Requires 8+ chars • 1 uppercase • 1 number • 1 symbol"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={changePassword}
            disabled={busy !== null}
            className="mt-5 flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-[12.5px] font-bold text-stone-700 transition hover:border-stone-900 disabled:opacity-60"
          >
            {busy === "password" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update password
          </button>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-400">
            <Database className="h-3 w-3" />
            {accounts ?? "…"} registered account(s) in the{" "}
            {dbMode === "neon" ? "Neon Postgres database" : "local vault"}.
          </p>
        </div>

        {/* ─── Danger zone ─── */}
        <div className="rounded-3xl border border-red-200 bg-red-50/60 p-7">
          <p className="flex items-center gap-2.5 font-serif text-[19px] font-semibold text-red-600">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-stone-600">
            Permanently delete your Dail Justice profile. This erases your account row, every
            booking, and every document from the database.{" "}
            <b className="text-red-500">This cannot be undone.</b>
          </p>

          {!armDelete ? (
            <button
              onClick={() => setArmDelete(true)}
              className="mt-5 flex items-center gap-2 rounded-full border border-red-300 px-6 py-3 text-[12.5px] font-bold text-red-600 transition hover:bg-red-100/60"
            >
              <Trash2 className="h-4 w-4" />
              Delete my profile…
            </button>
          ) : (
            <div className="mt-5 rounded-2xl border border-red-200 bg-white p-5">
              <label className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
                Type <span className="font-mono text-red-600">DELETE</span> to confirm
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-red-300 bg-red-50/50 px-4 py-3 font-mono text-[13.5px] tracking-[0.2em] text-red-600 placeholder:text-stone-400 outline-none focus:border-red-500"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={destroy}
                  disabled={confirmText.trim().toUpperCase() !== "DELETE" || busy !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 py-3 text-[12.5px] font-bold text-white transition enabled:hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {busy === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Permanently delete everything
                </button>
                <button
                  onClick={() => {
                    setArmDelete(false);
                    setConfirmText("");
                  }}
                  className="rounded-full border border-stone-300 px-6 py-3 text-[12.5px] font-bold text-stone-500 transition hover:border-stone-400"
                >
                  Keep account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
