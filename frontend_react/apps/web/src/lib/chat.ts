// ── Chat WebSocket base ───────────────────────────────────────────────────────
// Connects DIRECTLY to the chat service (port 8007), not through the gateway —
// the gateway does not proxy WebSocket upgrades. Shared by the room page and the
// app-wide presence listener so the two can never drift.
export const CHAT_WS_BASE = "ws://localhost:8007/chat/ws";

/** Decode the `sub` (user UUID) from a JWT access token, without a library. */
export function subFromToken(token: string | null): string {
  if (!token) return "";
  try {
    return JSON.parse(atob(token.split(".")[1])).sub ?? "";
  } catch {
    return "";
  }
}
