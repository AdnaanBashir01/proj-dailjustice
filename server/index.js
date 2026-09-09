// ═══════════════════════════════════════════════════════════════════════════
//  DAIL JUSTICE · FULL BACKEND SERVER  (zero-dependency Node.js ≥ 18)
// ───────────────────────────────────────────────────────────────────────────
//  ONE process does everything:
//    • Serves the entire web app        →  GET http://localhost:8090/
//    • Health & capability telemetry    →  GET http://localhost:8090/api/health
//    • Real LLM chat (Gemini proxy)     →  POST http://localhost:8090/api/chat
//      (returns text + smart follow-up SUGGESTIONS for the chat UI)
//    • Sliding-window rate limiting (anti-abuse)
//    • API key stays HERE — the browser never sees it
//
//  SETUP:
//    1. FREE key → https://aistudio.google.com → "Get API key"
//    2. Paste it in  server/.env  (GEMINI_API_KEY=...)
//    3. Build once:  npm run build        (produces dist/index.html)
//    4. Start:       node server/index.js
//    5. Open:        http://localhost:8090          ← full app + AI here
//       (for dev with hot reload instead: npm run dev on :5173, keep this running)
//
//  If no key is set, the server still runs and reports llm:false — the
//  frontend automatically falls back to its offline rule-based engine.
// ═══════════════════════════════════════════════════════════════════════════

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ── Minimal .env loader (no dotenv dependency) ──────────────────────────────
const HERE = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(join(HERE, ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  /* .env optional */
}

const PORT = Number(process.env.PORT || 8090);
const GEMINI_KEY = (process.env.GEMINI_API_KEY || "").trim();
const MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
const BOOT_AT = Date.now();
let requestCount = 0;

// Serve the built single-file SPA from memory (all assets are inlined in it)
let INDEX_HTML = null;
try {
  INDEX_HTML = readFileSync(join(HERE, "..", "dist", "index.html"), "utf8");
} catch {
  /* built later — will 200 with instructions */
}

const SYSTEM_PROMPT = `You are Lexi, the 24/7 AI legal concierge inside "Dail Justice", an Indian lawyer-booking web app.

Personality & rules:
- Warm, precise, professional. Plain English; explain any jargon briefly.
- Indian law context (BNSS, BNS, NI Act, Consumer Protection Act, IT Act, RERA).
- Structure answers as SHORT bullet-style lines, each its own sentence.
- Hard limit ~120 words unless the user explicitly asks for detail.
- NEVER claim to be a lawyer; NEVER give verdicts. End legal explanations with: "This is information, not legal advice."
- NEVER fabricate sections, citations or dates you are unsure of — say "verify with an advocate" instead.
- Urgent/safety matters (arrest, threats, violence): advise immediate professional/police help FIRST.
- Map issues to practice areas (criminal, family, property, corporate, cyber, consumer, immigration, tax) and recommend booking a verified advocate on Dail Justice for specifics.
- Stay on topic: law, rights, procedures, documents, and this platform. Politely redirect anything else.

RESPONSE FORMAT — mandatory:
End every reply with ONE final line exactly like:
SUGGESTIONS: follow-up question 1 | follow-up question 2 | follow-up question 3
Rules for suggestions: natural NEXT USER QUESTIONS (max 8 words each), diverse (one deeper dive, one procedural, one towards booking/action), never repeat the question just answered.`;

// ── Sliding-window rate limiter: 60 req/min per IP ──────────────────────────
const hits = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 60;
}

const send = (res, status, obj, extraHeaders = {}) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders,
  });
  res.end(JSON.stringify(obj));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 1_000_000) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/** Call Gemini with conversation history → { text, followups[] } */
async function askGemini(messages) {
  const started = Date.now();
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content || "").slice(0, 4000) }],
        })),
        generationConfig: { temperature: 0.45, maxOutputTokens: 800 },
      }),
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.error) {
    throw new Error(data?.error?.message || `Gemini HTTP ${resp.status}`);
  }

  let text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();
  if (!text) return { text: null, followups: [] };

  // Parse the mandatory SUGGESTIONS: tail line into UI chips
  const m = text.match(/SUGGESTIONS\s*:\s*([^\n]+)/i);
  let followups = [];
  if (m) {
    followups = m[1]
      .split("|")
      .map((s) => s.trim().replace(/^[-•\d.)\s]+/, ""))
      .filter((s) => s.length > 2 && s.length <= 60)
      .slice(0, 3);
    text = text.slice(0, m.index).trim();
  }
  console.log(`[Lexi] ${MODEL} → reply in ${Date.now() - started}ms · ${followups.length} suggestions`);
  return { text, followups };
}

const server = createServer(async (req, res) => {
  requestCount++;
  const ip = req.socket.remoteAddress || "unknown";
  const url = (req.url || "/").split("?")[0];

  if (req.method === "OPTIONS") return send(res, 204, {});

  // ── GET /api/health — capability probe for the frontend badge ────────────
  if (req.method === "GET" && url === "/api/health") {
    return send(res, 200, {
      ok: true,
      llm: Boolean(GEMINI_KEY),
      model: MODEL,
      uptimeSec: Math.floor((Date.now() - BOOT_AT) / 1000),
      requests: requestCount,
      staticAppServed: Boolean(INDEX_HTML),
    });
  }

  // ── POST /api/chat — real LLM conversation with suggestions ───────────────
  if (req.method === "POST" && url === "/api/chat") {
    try {
      if (isRateLimited(ip)) {
        return send(res, 429, { error: "Too many requests — slow down a moment." });
      }
      if (!GEMINI_KEY) {
        return send(res, 503, {
          error: "GEMINI_API_KEY not configured on the server (add it in server/.env and restart).",
        });
      }
      const body = await readBody(req);
      const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
      if (!messages.length || !String(messages[messages.length - 1].content || "").trim()) {
        return send(res, 400, { error: "messages[] with a final user message is required" });
      }
      const { text, followups } = await askGemini(messages);
      if (!text) return send(res, 502, { error: "Empty answer from the model — try rephrasing." });
      return send(res, 200, { text, followups, model: MODEL });
    } catch (e) {
      console.error("[Lexi] backend error:", e.message);
      const status = /quota|rate|429/i.test(e.message) ? 429 : 502;
      return send(res, status, { error: e.message });
    }
  }

  // ── Everything else GET → serve the single-file web app ──────────────────
  if (req.method === "GET" && !url.startsWith("/api/")) {
    if (INDEX_HTML) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(INDEX_HTML);
    }
    return send(res, 200, {
      ok: true,
      message:
        "Backend is running. The web app bundle was not found — run `npm run build` once, then restart `node server/index.js` and open http://localhost:8090/",
    });
  }

  return send(res, 404, { error: "Not found." });
});

server.listen(PORT, () => {
  console.log("──────────────────────────────────────────────────────");
  console.log(" ⚖  DAIL JUSTICE · FULL BACKEND RUNNING");
  console.log(`    Web app:   http://localhost:${PORT}/`);
  console.log(`    Health:    http://localhost:${PORT}/api/health`);
  console.log(`    LLM:       ${GEMINI_KEY ? `ENABLED (${MODEL})` : "DISABLED — add GEMINI_API_KEY to server/.env"}`);
  console.log(`    App bundle:${INDEX_HTML ? " serving dist/index.html" : " NOT FOUND — run npm run build"}`);
  console.log(`    Rate cap:  60 req/min per client`);
  console.log("──────────────────────────────────────────────────────");
});
