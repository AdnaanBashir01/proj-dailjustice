// ─── Frontend ↔ Backend bridge (real LLM via our own API server) ───────────

const BACKEND = (
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_BACKEND_URL ?? "http://localhost:8090"
).replace(/\/$/, "");

export const BACKEND_URL = BACKEND;

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface LexiAIReply {
  text: string;
  followups: string[];
}

/** Probe the backend: is it up AND does it have an LLM key configured? */
export async function checkBackend(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${BACKEND}/api/health`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const data = (await res.json()) as { llm?: boolean };
    return data.llm === true;
  } catch {
    return false;
  }
}

/**
 * Ask the real LLM (Gemini, proxied by our backend).
 * Returns { text, followups } or null on ANY failure → caller falls back
 * to the offline rule-based engine. followups feed the suggestion chips.
 */
export async function lexiChat(history: ChatHistoryItem[]): Promise<LexiAIReply | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`${BACKEND}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-10) }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string; followups?: unknown };
    const text = data.text?.trim();
    if (!text) return null;
    const followups = Array.isArray(data.followups)
      ? data.followups.slice(0, 3).map((s) => String(s)).filter((s) => s.length > 1)
      : [];
    return { text, followups };
  } catch {
    return null;
  }
}
