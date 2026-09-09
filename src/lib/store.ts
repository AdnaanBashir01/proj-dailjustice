// ─── Dail Justice · local data layer (localStorage-backed) ───────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  createdAt: number;
}

export interface Booking {
  id: string;
  userId: string;
  lawyerId: string;
  date: string; // ISO yyyy-mm-dd
  time: string;
  type: "video" | "phone" | "person";
  notes: string;
  fee: number;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: number;
}

export interface DocFile {
  id: string;
  userId: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
  uploadedAt: number;
}

const K_USERS = "dj_users_v1";
const K_SESSION = "dj_session_v1";
const K_BOOKINGS = "dj_bookings_v1";
const K_DOCS = "dj_docs_v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const fmtBytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

// ─── Users ───────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return read<User[]>(K_USERS, []);
}

export function getUserById(id: string): User | null {
  return getUsers().find((u) => u.id === id) ?? null;
}

export function createUser(
  name: string,
  email: string,
  password: string,
  securityQuestion = "",
  securityAnswer = ""
): { ok: true; user: User } | { ok: false; error: string } {
  const users = getUsers();
  const em = email.trim().toLowerCase();
  if (users.some((u) => u.email === em)) {
    return { ok: false, error: "An account with this email already exists. Try logging in." };
  }
  const user: User = {
    id: uid(),
    name: name.trim(),
    email: em,
    password,
    securityQuestion,
    securityAnswer: securityAnswer.trim().toLowerCase(),
    createdAt: Date.now(),
  };
  users.push(user);
  write(K_USERS, users);
  return { ok: true, user };
}

export function authenticate(
  email: string,
  password: string
): { ok: true; user: User } | { ok: false; error: string } {
  const em = email.trim().toLowerCase();
  const user = getUsers().find((u) => u.email === em);
  if (!user) return { ok: false, error: "No account found with this email. Create one first." };
  if (user.password !== password) return { ok: false, error: "Incorrect password. Please try again." };
  return { ok: true, user };
}

export function updateUser(user: User) {
  write(
    K_USERS,
    getUsers().map((u) => (u.id === user.id ? user : u))
  );
}

/** Delete the account plus every booking & document that belongs to it */
export function deleteUserCascade(userId: string) {
  write(
    K_USERS,
    getUsers().filter((u) => u.id !== userId)
  );
  write(
    K_BOOKINGS,
    listAllBookings().filter((b) => b.userId !== userId)
  );
  write(
    K_DOCS,
    read<DocFile[]>(K_DOCS, []).filter((d) => d.userId !== userId)
  );
  clearSession();
}

// ─── Session ─────────────────────────────────────────────────────────────────

export function setSession(userId: string) {
  localStorage.setItem(K_SESSION, userId);
}

export function clearSession() {
  localStorage.removeItem(K_SESSION);
}

export function getSessionId(): string | null {
  return localStorage.getItem(K_SESSION);
}

export function getSessionUser(): User | null {
  const id = localStorage.getItem(K_SESSION);
  return id ? getUserById(id) : null;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

function listAllBookings(): Booking[] {
  return read<Booking[]>(K_BOOKINGS, []);
}

export function listBookings(userId: string): Booking[] {
  return listAllBookings()
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function addBooking(b: Booking) {
  const all = listAllBookings();
  all.push(b);
  write(K_BOOKINGS, all);
}

export function updateBookingStatus(id: string, status: Booking["status"]) {
  write(
    K_BOOKINGS,
    listAllBookings().map((b) => (b.id === id ? { ...b, status } : b))
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────

export function listDocs(userId: string): DocFile[] {
  return read<DocFile[]>(K_DOCS, [])
    .filter((d) => d.userId === userId)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export function addDoc(d: DocFile) {
  const all = read<DocFile[]>(K_DOCS, []);
  all.push(d);
  write(K_DOCS, all); // may throw QuotaExceededError — caller handles
}

export function removeDoc(id: string) {
  write(
    K_DOCS,
    read<DocFile[]>(K_DOCS, []).filter((d) => d.id !== id)
  );
}
