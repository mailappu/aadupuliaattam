// Compact serializer for sharing/replaying games.
// A game is fully described by its move history (engine is deterministic).
// Each move encodes as 1-2 bytes (base36-packed).
//
// Format v1: "v1:<base64url-encoded bytes>"
//   place  : kind=0, payload=to (5 bits)            -> 1 byte
//   move   : kind=1, payload=from(5)|to(5)          -> 2 bytes
//   capture: kind=2, payload=from(5)|over(5)|to(5) -> 3 bytes
// We use a variable scheme written into a Uint8Array.

import { applyMove, createInitialState, type GameState, type Move } from "@/game/engine";

const PREFIX = "v1:";

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function fromBase64Url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b = atob(str.replaceAll("-", "+").replaceAll("_", "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

export function encodeHistory(history: Move[]): string {
  const buf: number[] = [];
  for (const m of history) {
    if (m.kind === "place") {
      buf.push(0, m.to);
    } else if (m.kind === "move") {
      buf.push(1, m.from, m.to);
    } else {
      buf.push(2, m.from, m.over, m.to);
    }
  }
  return PREFIX + toBase64Url(new Uint8Array(buf));
}

export function decodeHistory(code: string): Move[] {
  if (!code.startsWith(PREFIX)) throw new Error("Unsupported share format");
  const bytes = fromBase64Url(code.slice(PREFIX.length));
  const moves: Move[] = [];
  let i = 0;
  while (i < bytes.length) {
    const kind = bytes[i++];
    if (kind === 0) {
      moves.push({ kind: "place", to: bytes[i++] });
    } else if (kind === 1) {
      moves.push({ kind: "move", from: bytes[i++], to: bytes[i++] });
    } else if (kind === 2) {
      moves.push({ kind: "capture", from: bytes[i++], over: bytes[i++], to: bytes[i++] });
    } else {
      throw new Error("Bad replay byte");
    }
  }
  return moves;
}

export function replayToState(history: Move[], upToPly: number = history.length): GameState {
  let s = createInitialState();
  for (let i = 0; i < Math.min(upToPly, history.length); i++) {
    s = applyMove(s, history[i]);
  }
  return s;
}

export function shareUrl(history: Move[]): string {
  const code = encodeHistory(history);
  const u = new URL(window.location.origin + "/replay");
  u.searchParams.set("g", code);
  return u.toString();
}
