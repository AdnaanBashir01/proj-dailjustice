// ═══════════════════════════════════════════════════════════════════════════
//  DAIL JUSTICE · NEON DATABASE CONFIGURATION
// ─────────────────────────────────────────────────────────────
//  You can connect your Neon database in EITHER of two ways:
//
//  OPTION A (recommended) · the .env file:
//    Open the file named  .env  in the project ROOT (same folder as
//    package.json) and paste your string after  VITE_NEON_DATABASE_URL=
//
//  OPTION B · paste directly:
//    Replace PASTE_YOUR_NEON_CONNECTION_STRING_HERE below (keep the quotes).
//
//  GET THE STRING FROM NEON (2 minutes):
//  1. https://neon.tech → Sign up free → "Create project" → name: dail-justice
//  2. Dashboard → "Connect" → copy the connection string. It looks like:
//     postgresql://user:password@ep-xxxx-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
//
//  TABLES AUTO-CREATE on first launch: dj_users · dj_bookings · dj_docs
//  NO STRING YET? The app runs fine on a local browser vault until you add it.
//
//  SECURITY NOTE: fine for a classroom demo — delete/rotate the Neon project
//  after your presentation. Production apps should use a backend API.
// ═══════════════════════════════════════════════════════════════════════════

// ── OPTION B: paste here if you don't want to use the .env file ──
const MANUAL_CONNECTION_STRING = "PASTE_YOUR_NEON_CONNECTION_STRING_HERE";

// ── OPTION A: read automatically from the .env file (Vite injects it) ──
const FROM_ENV = (
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_NEON_DATABASE_URL ?? ""
).trim();

// .env file wins if both are set
export const NEON_CONNECTION_STRING = FROM_ENV || MANUAL_CONNECTION_STRING.trim();

export const isNeonConfigured = () =>
  /^postgres(ql)?:\/\//i.test(NEON_CONNECTION_STRING);
