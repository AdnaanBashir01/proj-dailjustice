// ─── Dail Justice · Cloud data layer ────────────────────────────────────────
//  Talks to Neon serverless Postgres over HTTP (via @neondatabase/serverless).
//  If no connection string is configured (or Neon is unreachable), every
//  operation gracefully falls back to the local browser vault so the app
//  never breaks mid-demo.
// ───────────────────────────────────────────────────────────────────────────

import { neon } from "@neondatabase/serverless";
import { NEON_CONNECTION_STRING, isNeonConfigured } from "./dbConfig";
import * as ls from "./store";
import type { Booking, DocFile, User } from "./store";
import type { Lawyer } from "../data/lawyers";

export type { User, Booking, DocFile } from "./store";
export { uid, inr, fmtBytes, setSession, clearSession, getSessionId } from "./store";

const sql = isNeonConfigured() ? neon(NEON_CONNECTION_STRING.trim()) : null;

let neonDead = false;
let initPromise: Promise<void> | null = null;

const useNeon = () => sql !== null && !neonDead;

export const getDbMode = (): "neon" | "local" => (useNeon() ? "neon" : "local");

// ─── Schema bootstrap (auto-creates tables on first launch) ─────────────────

const DDL = [
  `CREATE TABLE IF NOT EXISTS dj_users (
     id          TEXT PRIMARY KEY,
     name        TEXT NOT NULL,
     email       TEXT NOT NULL,
     password    TEXT NOT NULL,
     phone       TEXT NOT NULL DEFAULT '',
     city        TEXT NOT NULL DEFAULT '',
     created_at  DOUBLE PRECISION NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS dj_bookings (
     id          TEXT PRIMARY KEY,
     user_id     TEXT NOT NULL,
     lawyer_id   TEXT NOT NULL,
     date        TEXT NOT NULL,
     time        TEXT NOT NULL,
     type        TEXT NOT NULL,
     notes       TEXT NOT NULL DEFAULT '',
     fee         INTEGER NOT NULL,
     status      TEXT NOT NULL,
     created_at  DOUBLE PRECISION NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS dj_docs (
     id           TEXT PRIMARY KEY,
     user_id      TEXT NOT NULL,
     name         TEXT NOT NULL,
     mime         TEXT NOT NULL DEFAULT '',
     size         INTEGER NOT NULL DEFAULT 0,
     data_url     TEXT NOT NULL,
     uploaded_at  DOUBLE PRECISION NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS dj_lawyers (
     id          TEXT PRIMARY KEY,
     name        TEXT NOT NULL,
     title       TEXT NOT NULL DEFAULT '',
     area        TEXT NOT NULL DEFAULT '',
     city        TEXT NOT NULL DEFAULT '',
     experience  INTEGER NOT NULL DEFAULT 0,
     fee         INTEGER NOT NULL DEFAULT 0,
     mode        TEXT NOT NULL DEFAULT 'Online',
     blurb       TEXT NOT NULL DEFAULT '',
     rating      DOUBLE PRECISION NOT NULL DEFAULT 5,
     reviews     INTEGER NOT NULL DEFAULT 0,
     created_at  DOUBLE PRECISION NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS dj_notifications (
     id          TEXT PRIMARY KEY,
     user_id     TEXT NOT NULL,
     tag         TEXT NOT NULL DEFAULT 'INFO',
     title       TEXT NOT NULL,
     body        TEXT NOT NULL DEFAULT '',
     created_at  DOUBLE PRECISION NOT NULL,
     read_at     DOUBLE PRECISION NOT NULL DEFAULT 0
   )`,
  // Account-recovery columns (idempotent — safe for already-created tables)
  `ALTER TABLE dj_users ADD COLUMN IF NOT EXISTS security_question TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE dj_users ADD COLUMN IF NOT EXISTS security_answer TEXT NOT NULL DEFAULT ''`,
];

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!sql) return;
      try {
        for (const stmt of DDL) await sql.query(stmt);
      } catch (e) {
        console.warn("[Dail Justice] Neon unreachable — falling back to local vault.", e);
        neonDead = true;
      }
    })();
  }
  return initPromise;
}

export async function initDb(): Promise<void> {
  await ensureInit();
}

// ─── Dual-engine executor: Neon first, localStorage fallback ────────────────

async function exec<T>(neonFn: () => Promise<T>, localFn: () => T): Promise<T> {
  await ensureInit();
  if (!useNeon()) return localFn();
  try {
    return await neonFn();
  } catch (e) {
    console.warn("[Dail Justice] Neon query failed — using local vault for this session.", e);
    neonDead = true;
    return localFn();
  }
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

const toUser = (r: Record<string, unknown>): User => ({
  id: String(r.id),
  name: String(r.name),
  email: String(r.email),
  password: String(r.password),
  phone: r.phone ? String(r.phone) : undefined,
  city: r.city ? String(r.city) : undefined,
  securityQuestion: r.security_question ? String(r.security_question) : undefined,
  securityAnswer: r.security_answer ? String(r.security_answer) : undefined,
  createdAt: Number(r.created_at),
});

const toBooking = (r: Record<string, unknown>): Booking => ({
  id: String(r.id),
  userId: String(r.user_id),
  lawyerId: String(r.lawyer_id),
  date: String(r.date),
  time: String(r.time),
  type: String(r.type) as Booking["type"],
  notes: String(r.notes ?? ""),
  fee: Number(r.fee),
  status: String(r.status) as Booking["status"],
  createdAt: Number(r.created_at),
});

const toDoc = (r: Record<string, unknown>): DocFile => ({
  id: String(r.id),
  userId: String(r.user_id),
  name: String(r.name),
  mime: String(r.mime),
  size: Number(r.size),
  dataUrl: String(r.data_url),
  uploadedAt: Number(r.uploaded_at),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  return exec(
    async () => {
      const rows = (await sql!.query("SELECT * FROM dj_users WHERE id = $1", [id])) as Record<
        string,
        unknown
      >[];
      return rows.length ? toUser(rows[0]) : null;
    },
    () => ls.getUserById(id)
  );
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  securityQuestion = "",
  securityAnswer = ""
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const res = await exec(
    async () => {
      const em = email.trim().toLowerCase();
      const dup = (await sql!.query("SELECT id FROM dj_users WHERE email = $1", [em])) as Record<
        string,
        unknown
      >[];
      if (dup.length > 0) {
        return { ok: false as const, error: "An account with this email already exists. Try logging in." };
      }
      const user: User = {
        id: ls.uid(),
        name: name.trim(),
        email: em,
        password,
        securityQuestion,
        securityAnswer: securityAnswer.trim().toLowerCase(),
        createdAt: Date.now(),
      };
      await sql!.query(
        "INSERT INTO dj_users (id, name, email, password, phone, city, security_question, security_answer, created_at) VALUES ($1,$2,$3,$4,'','',$5,$6,$7)",
        [
          user.id,
          user.name,
          user.email,
          user.password,
          user.securityQuestion ?? "",
          user.securityAnswer ?? "",
          user.createdAt,
        ]
      );
      return { ok: true as const, user };
    },
    () => ls.createUser(name, email, password, securityQuestion, securityAnswer)
  );
  if (res.ok) {
    await addNotification(
      res.user.id,
      "ACCOUNT",
      "Welcome to Dail Justice",
      `${res.user.name.split(" ")[0]}, your secure chamber is ready — book your first consultation anytime.`
    );
  }
  return res;
}

export async function authenticate(
  email: string,
  password: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  return exec(
    async () => {
      const em = email.trim().toLowerCase();
      const rows = (await sql!.query("SELECT * FROM dj_users WHERE email = $1", [em])) as Record<
        string,
        unknown
      >[];
      if (!rows.length) {
        return { ok: false as const, error: "No account found with this email. Create one first." };
      }
      const u = toUser(rows[0]);
      if (u.password !== password) {
        return { ok: false as const, error: "Incorrect password. Please try again." };
      }
      return { ok: true as const, user: u };
    },
    () => ls.authenticate(email, password)
  );
}

export async function updateUser(user: User): Promise<void> {
  return exec(
    async () => {
      await sql!.query(
        "UPDATE dj_users SET name=$1, phone=$2, city=$3, password=$4 WHERE id=$5",
        [user.name, user.phone ?? "", user.city ?? "", user.password, user.id]
      );
    },
    () => ls.updateUser(user)
  );
}

export async function countUsers(): Promise<number> {
  return exec(
    async () => {
      const rows = (await sql!.query("SELECT COUNT(*)::int AS c FROM dj_users")) as Record<
        string,
        unknown
      >[];
      return Number(rows[0]?.c ?? 0);
    },
    () => ls.getUsers().length
  );
}

/** Delete the account plus every booking & document that belongs to it */
export async function deleteUserCascade(userId: string): Promise<void> {
  await exec(
    async () => {
      await sql!.query("DELETE FROM dj_bookings WHERE user_id=$1", [userId]);
      await sql!.query("DELETE FROM dj_docs WHERE user_id=$1", [userId]);
      await sql!.query("DELETE FROM dj_notifications WHERE user_id=$1", [userId]);
      await sql!.query("DELETE FROM dj_users WHERE id=$1", [userId]);
    },
    () => {
      // local cascade also clears the session
      ls.deleteUserCascade(userId);
    }
  );
  try {
    const all = JSON.parse(localStorage.getItem(K_NOTIFS) ?? "[]") as AppNotice[];
    localStorage.setItem(K_NOTIFS, JSON.stringify(all.filter((n) => n.userId !== userId)));
  } catch {
    // ignore
  }
  ls.clearSession();
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function listBookings(userId: string): Promise<Booking[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_bookings WHERE user_id=$1 ORDER BY created_at DESC",
        [userId]
      )) as Record<string, unknown>[];
      return rows.map(toBooking);
    },
    () => ls.listBookings(userId)
  );
}

export async function addBooking(b: Booking): Promise<void> {
  return exec(
    async () => {
      await sql!.query(
        "INSERT INTO dj_bookings (id, user_id, lawyer_id, date, time, type, notes, fee, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [b.id, b.userId, b.lawyerId, b.date, b.time, b.type, b.notes, b.fee, b.status, b.createdAt]
      );
    },
    () => ls.addBooking(b)
  );
}

export async function updateBookingStatus(id: string, status: Booking["status"]): Promise<void> {
  return exec(
    async () => {
      await sql!.query("UPDATE dj_bookings SET status=$1 WHERE id=$2", [status, id]);
    },
    () => ls.updateBookingStatus(id, status)
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function listDocs(userId: string): Promise<DocFile[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_docs WHERE user_id=$1 ORDER BY uploaded_at DESC",
        [userId]
      )) as Record<string, unknown>[];
      return rows.map(toDoc);
    },
    () => ls.listDocs(userId)
  );
}

export async function addDoc(d: DocFile): Promise<void> {
  return exec(
    async () => {
      await sql!.query(
        "INSERT INTO dj_docs (id, user_id, name, mime, size, data_url, uploaded_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [d.id, d.userId, d.name, d.mime, d.size, d.dataUrl, d.uploadedAt]
      );
    },
    () => ls.addDoc(d) // may throw QuotaExceededError — caller handles
  );
}

export async function removeDoc(id: string): Promise<void> {
  return exec(
    async () => {
      await sql!.query("DELETE FROM dj_docs WHERE id=$1", [id]);
    },
    () => ls.removeDoc(id)
  );
}

// ─── Custom lawyers (added via "Add a lawyer") ────────────────────────────────

const K_CUSTOM_LAWYERS = "dj_custom_lawyers_v1";

export interface NewLawyerInput {
  name: string;
  area: string;
  city: string;
  experience: number;
  fee: number;
  mode: Lawyer["mode"];
  blurb: string;
}

interface LawyerRow {
  id: string;
  name: string;
  title: string;
  area: string;
  city: string;
  experience: number;
  fee: number;
  mode: Lawyer["mode"];
  blurb: string;
  rating: number;
  reviews: number;
  createdAt: number;
}

function rowToLawyer(r: LawyerRow): Lawyer {
  return {
    id: r.id,
    name: r.name,
    photo: "",
    title: r.title,
    areas: [r.area],
    experience: r.experience,
    rating: r.rating,
    reviews: r.reviews,
    fee: r.fee,
    languages: ["English", "Hindi"],
    courts: "Chamber address shared after booking",
    education: "Bar Council verified advocate",
    about: r.blurb,
    blurb: r.blurb,
    tags: [r.area.split(" ")[0].replace(/&/g, "").trim(), "Consultations"],
    mode: r.mode,
    casesWon: 0,
    responseTime: "~1 hr",
    city: r.city,
  };
}

export async function addCustomLawyer(input: NewLawyerInput): Promise<Lawyer> {
  const cleaned = input.name.trim().replace(/^(adv\.?\s*)?/i, "Adv. ");
  const row: LawyerRow = {
    id: `cx-${ls.uid()}`,
    name: cleaned,
    title: `${input.area} Specialist`,
    area: input.area,
    city: input.city.trim(),
    experience: input.experience,
    fee: input.fee,
    mode: input.mode,
    blurb: input.blurb.trim(),
    rating: 5,
    reviews: 0,
    createdAt: Date.now(),
  };
  await exec(
    async () => {
      await sql!.query(
        "INSERT INTO dj_lawyers (id, name, title, area, city, experience, fee, mode, blurb, rating, reviews, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [
          row.id, row.name, row.title, row.area, row.city, row.experience,
          row.fee, row.mode, row.blurb, row.rating, row.reviews, row.createdAt,
        ]
      );
    },
    () => {
      try {
        const all = JSON.parse(
          localStorage.getItem(K_CUSTOM_LAWYERS) ?? "[]"
        ) as LawyerRow[];
        all.push(row);
        localStorage.setItem(K_CUSTOM_LAWYERS, JSON.stringify(all));
      } catch {
        // vault full — ignore
      }
    }
  );
  return rowToLawyer(row);
}

// ─── Notifications (event-driven, per user) ──────────────────────────────────

const K_NOTIFS = "dj_notifications_v1";

export interface AppNotice {
  id: string;
  userId: string;
  tag: string;
  title: string;
  body: string;
  createdAt: number;
  readAt: number;
}

export async function addNotification(
  userId: string,
  tag: string,
  title: string,
  body: string
): Promise<void> {
  const n: AppNotice = {
    id: ls.uid(),
    userId,
    tag,
    title,
    body,
    createdAt: Date.now(),
    readAt: 0,
  };
  await exec(
    async () => {
      await sql!.query(
        "INSERT INTO dj_notifications (id, user_id, tag, title, body, created_at, read_at) VALUES ($1,$2,$3,$4,$5,$6,0)",
        [n.id, n.userId, n.tag, n.title, n.body, n.createdAt]
      );
    },
    () => {
      try {
        const all = JSON.parse(localStorage.getItem(K_NOTIFS) ?? "[]") as AppNotice[];
        all.push(n);
        localStorage.setItem(K_NOTIFS, JSON.stringify(all.slice(-200)));
      } catch {
        // ignore
      }
    }
  );
}

export async function listNotifications(userId: string): Promise<AppNotice[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",
        [userId]
      )) as Record<string, unknown>[];
      return rows.map((r) => ({
        id: String(r.id),
        userId: String(r.user_id),
        tag: String(r.tag),
        title: String(r.title),
        body: String(r.body),
        createdAt: Number(r.created_at),
        readAt: Number(r.read_at),
      }));
    },
    () => {
      try {
        return (JSON.parse(localStorage.getItem(K_NOTIFS) ?? "[]") as AppNotice[])
          .filter((n) => n.userId === userId)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 30);
      } catch {
        return [];
      }
    }
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const now = Date.now();
  await exec(
    async () => {
      await sql!.query("UPDATE dj_notifications SET read_at=$1 WHERE user_id=$2 AND read_at=0", [
        now,
        userId,
      ]);
    },
    () => {
      try {
        const all = JSON.parse(localStorage.getItem(K_NOTIFS) ?? "[]") as AppNotice[];
        localStorage.setItem(
          K_NOTIFS,
          JSON.stringify(
            all.map((n) => (n.userId === userId ? { ...n, readAt: now } : n))
          )
        );
      } catch {
        // ignore
      }
    }
  );
}

// ─── Admin console ───────────────────────────────────────────────────────────
//  ►► ADMIN CREDENTIALS — change these two values anytime. Notes:
//     • ADMIN_EMAIL is what ROUTES a login to the admin dashboard.
//     • Changing the email seeds a NEW admin account on next launch
//       (the old admin email automatically becomes a normal user).
//     • Fastest password change without re-seeding — run in Neon SQL Editor:
//         UPDATE dj_users SET password = 'YourNewPass' WHERE email = 'admin@dailjustice.com';
//     • Full reset: run  DELETE FROM dj_users WHERE email = 'admin@dailjustice.com';
//       then restart — ensureAdmin() re-seeds with the constants below.

export const ADMIN_EMAIL = "admin@dailjustice.com";
export const ADMIN_PASSWORD = "admin1234";
export const isAdminEmail = (email: string) =>
  email.trim().toLowerCase() === ADMIN_EMAIL;

const K_BOOKINGS_RAW = "dj_bookings_v1";
const K_DOCS_RAW = "dj_docs_v1";

/** Seed the admin account once (called at app boot) */
export async function ensureAdmin(): Promise<void> {
  try {
    await ensureInit();
    if (useNeon() && sql) {
      const rows = (await sql.query("SELECT id FROM dj_users WHERE email=$1", [
        ADMIN_EMAIL,
      ])) as Record<string, unknown>[];
      if (rows.length === 0) {
        await sql.query(
          "INSERT INTO dj_users (id, name, email, password, phone, city, created_at) VALUES ($1,$2,$3,$4,'','',$5)",
          ["admin-root", "Platform Admin", ADMIN_EMAIL, ADMIN_PASSWORD, Date.now()]
        );
      }
    } else {
      ls.createUser("Platform Admin", ADMIN_EMAIL, ADMIN_PASSWORD); // no-op if exists
    }
  } catch {
    // never block boot
  }
}

export interface AdminStats {
  users: number;
  customAdvocates: number;
  bookings: number;
  completed: number;
  revenue: number;
  docs: number;
  notifications: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return exec(
    async () => {
      const rows = (await sql!.query(`SELECT
        (SELECT COUNT(*)::int FROM dj_users) AS users,
        (SELECT COUNT(*)::int FROM dj_lawyers) AS custom_advocates,
        (SELECT COUNT(*)::int FROM dj_bookings) AS bookings,
        (SELECT COUNT(*)::int FROM dj_bookings WHERE status='completed') AS completed,
        (SELECT COALESCE(SUM(fee),0)::int FROM dj_bookings WHERE status<>'cancelled') AS revenue,
        (SELECT COUNT(*)::int FROM dj_docs) AS docs,
        (SELECT COUNT(*)::int FROM dj_notifications) AS notifications`)) as Record<
        string,
        unknown
      >[];
      const r = rows[0] ?? {};
      return {
        users: Number(r.users ?? 0),
        customAdvocates: Number(r.custom_advocates ?? 0),
        bookings: Number(r.bookings ?? 0),
        completed: Number(r.completed ?? 0),
        revenue: Number(r.revenue ?? 0),
        docs: Number(r.docs ?? 0),
        notifications: Number(r.notifications ?? 0),
      };
    },
    () => {
      let bookings: Booking[] = [];
      let docsCount = 0;
      let notifCount = 0;
      try {
        bookings = JSON.parse(localStorage.getItem(K_BOOKINGS_RAW) ?? "[]") as Booking[];
        docsCount = (JSON.parse(localStorage.getItem(K_DOCS_RAW) ?? "[]") as unknown[]).length;
        notifCount = (JSON.parse(localStorage.getItem(K_NOTIFS) ?? "[]") as unknown[]).length;
      } catch {
        // ignore
      }
      const customCount = (JSON.parse(
        localStorage.getItem(K_CUSTOM_LAWYERS) ?? "[]"
      ) as unknown[]).length;
      return {
        users: ls.getUsers().length,
        customAdvocates: customCount,
        bookings: bookings.length,
        completed: bookings.filter((b) => b.status === "completed").length,
        revenue: bookings
          .filter((b) => b.status !== "cancelled")
          .reduce((s, b) => s + b.fee, 0),
        docs: docsCount,
        notifications: notifCount,
      };
    }
  );
}

export async function listAllUsers(): Promise<User[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_users ORDER BY created_at DESC LIMIT 200"
      )) as Record<string, unknown>[];
      return rows.map(toUser);
    },
    () =>
      ls
        .getUsers()
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
  );
}

export async function listAllBookingsGlobal(): Promise<Booking[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_bookings ORDER BY created_at DESC LIMIT 200"
      )) as Record<string, unknown>[];
      return rows.map(toBooking);
    },
    () => {
      try {
        return (JSON.parse(localStorage.getItem(K_BOOKINGS_RAW) ?? "[]") as Booking[]).sort(
          (a, b) => b.createdAt - a.createdAt
        );
      } catch {
        return [];
      }
    }
  );
}

export async function deleteCustomLawyer(id: string): Promise<void> {
  await exec(
    async () => {
      await sql!.query("DELETE FROM dj_lawyers WHERE id=$1", [id]);
    },
    () => {
      try {
        const all = JSON.parse(localStorage.getItem(K_CUSTOM_LAWYERS) ?? "[]") as { id: string }[];
        localStorage.setItem(K_CUSTOM_LAWYERS, JSON.stringify(all.filter((l) => l.id !== id)));
      } catch {
        // ignore
      }
    }
  );
}

export async function deleteBooking(id: string): Promise<void> {
  await exec(
    async () => {
      await sql!.query("DELETE FROM dj_bookings WHERE id=$1", [id]);
    },
    () => {
      try {
        const all = JSON.parse(localStorage.getItem(K_BOOKINGS_RAW) ?? "[]") as Booking[];
        localStorage.setItem(K_BOOKINGS_RAW, JSON.stringify(all.filter((b) => b.id !== id)));
      } catch {
        // ignore
      }
    }
  );
}

// ─── Account recovery (knowledge-based verification) ─────────────────────────

export async function getRecoveryQuestion(
  email: string
): Promise<{ ok: true; question: string } | { ok: false; error: string }> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT security_question FROM dj_users WHERE email=$1",
        [email.trim().toLowerCase()]
      )) as Record<string, unknown>[];
      if (!rows.length) return { ok: false as const, error: "No account found with this email." };
      const q = String(rows[0].security_question ?? "");
      if (!q)
        return {
          ok: false as const,
          error: "No recovery question is set on this account. Ask an admin for a manual reset.",
        };
      return { ok: true as const, question: q };
    },
    () => {
      const u = ls.getUsers().find((x) => x.email === email.trim().toLowerCase());
      if (!u) return { ok: false as const, error: "No account found with this email." };
      if (!u.securityQuestion)
        return {
          ok: false as const,
          error: "No recovery question is set on this account. Ask an admin for a manual reset.",
        };
      return { ok: true as const, question: u.securityQuestion };
    }
  );
}

export async function resetPassword(
  email: string,
  answer: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 4) {
    return { ok: false, error: "New password must be at least 4 characters." };
  }
  const em = email.trim().toLowerCase();
  const norm = answer.trim().toLowerCase();
  if (norm.length < 2) return { ok: false, error: "Answer your security question." };
  return exec(
    async () => {
      const rows = (await sql!.query("SELECT security_answer FROM dj_users WHERE email=$1", [
        em,
      ])) as Record<string, unknown>[];
      if (!rows.length) return { ok: false as const, error: "No account found with this email." };
      const correct = String(rows[0].security_answer ?? "");
      if (!correct || correct !== norm) {
        return { ok: false as const, error: "Incorrect answer — recovery denied." };
      }
      await sql!.query("UPDATE dj_users SET password=$1 WHERE email=$2", [newPassword, em]);
      return { ok: true as const };
    },
    () => {
      const u = ls.getUsers().find((x) => x.email === em);
      if (!u) return { ok: false as const, error: "No account found with this email." };
      if (!u.securityAnswer || u.securityAnswer !== norm) {
        return { ok: false as const, error: "Incorrect answer — recovery denied." };
      }
      ls.updateUser({ ...u, password: newPassword });
      return { ok: true as const };
    }
  );
}

/** Admin: every document on the platform — payload stripped for fast lists */
export async function listAllDocsGlobal(): Promise<DocFile[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT id, user_id, name, mime, size, uploaded_at FROM dj_docs ORDER BY uploaded_at DESC LIMIT 200"
      )) as Record<string, unknown>[];
      return rows.map((r) => ({
        id: String(r.id),
        userId: String(r.user_id),
        name: String(r.name),
        mime: String(r.mime),
        size: Number(r.size),
        dataUrl: "",
        uploadedAt: Number(r.uploaded_at),
      }));
    },
    () => {
      try {
        return (JSON.parse(localStorage.getItem(K_DOCS_RAW) ?? "[]") as DocFile[])
          .sort((a, b) => b.uploadedAt - a.uploadedAt)
          .map((d) => ({ ...d, dataUrl: "" }));
      } catch {
        return [];
      }
    }
  );
}

/** Admin: lazily fetch one document's payload (heavy base64) for preview/download */
export async function getDocPayload(id: string): Promise<string | null> {
  return exec(
    async () => {
      const rows = (await sql!.query("SELECT data_url FROM dj_docs WHERE id=$1", [id])) as Record<
        string,
        unknown
      >[];
      return rows.length ? String(rows[0].data_url) : null;
    },
    () => {
      try {
        const all = JSON.parse(localStorage.getItem(K_DOCS_RAW) ?? "[]") as DocFile[];
        return all.find((d) => d.id === id)?.dataUrl ?? null;
      } catch {
        return null;
      }
    }
  );
}

/** Admin: every notification event across all users (audit trail) */
export async function listAllNotificationsGlobal(): Promise<AppNotice[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_notifications ORDER BY created_at DESC LIMIT 100"
      )) as Record<string, unknown>[];
      return rows.map((r) => ({
        id: String(r.id),
        userId: String(r.user_id),
        tag: String(r.tag),
        title: String(r.title),
        body: String(r.body),
        createdAt: Number(r.created_at),
        readAt: Number(r.read_at),
      }));
    },
    () => {
      try {
        return (JSON.parse(localStorage.getItem(K_NOTIFS) ?? "[]") as AppNotice[]).sort(
          (a, b) => b.createdAt - a.createdAt
        );
      } catch {
        return [];
      }
    }
  );
}

export async function listCustomLawyers(): Promise<Lawyer[]> {
  return exec(
    async () => {
      const rows = (await sql!.query(
        "SELECT * FROM dj_lawyers ORDER BY created_at DESC"
      )) as Record<string, unknown>[];
      return rows.map((r) =>
        rowToLawyer({
          id: String(r.id),
          name: String(r.name),
          title: String(r.title),
          area: String(r.area),
          city: String(r.city),
          experience: Number(r.experience),
          fee: Number(r.fee),
          mode: String(r.mode) as Lawyer["mode"],
          blurb: String(r.blurb),
          rating: Number(r.rating),
          reviews: Number(r.reviews),
          createdAt: Number(r.created_at),
        })
      );
    },
    () => {
      try {
        return (
          JSON.parse(localStorage.getItem(K_CUSTOM_LAWYERS) ?? "[]") as LawyerRow[]
        ).map(rowToLawyer);
      } catch {
        return [];
      }
    }
  );
}
