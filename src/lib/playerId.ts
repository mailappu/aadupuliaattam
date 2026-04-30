// Stable anonymous browser ID used to identify a player in online rooms.
// No PII; just a random opaque token persisted in localStorage.

const KEY = "apa.playerId.v1";

export function getPlayerId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length >= 12) return existing;
    const id = `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `p_${Math.random().toString(36).slice(2, 14)}`;
  }
}

export function makeRoomCode(): string {
  // 6-char human-friendly code (no ambiguous chars)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
