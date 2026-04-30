// Web-Audio SFX — tiny synthesized cues. No assets needed.
// All sounds are short, on-demand, and silently no-op if audio is disabled.

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (muted) return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem("apa.muted", v ? "1" : "0"); } catch { /* noop */ }
}
export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem("apa.muted") === "1"; } catch { return false; }
}
muted = isMuted();

function blip(freq: number, dur = 0.09, type: OscillatorType = "sine", gain = 0.08) {
  const a = ac(); if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  g.gain.setValueAtTime(0, a.currentTime);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur + 0.02);
}

export const sfx = {
  place: () => blip(520, 0.06, "triangle", 0.06),
  move: () => blip(380, 0.05, "sine", 0.05),
  select: () => blip(680, 0.04, "sine", 0.04),
  capture: () => {
    blip(220, 0.18, "sawtooth", 0.09);
    setTimeout(() => blip(140, 0.22, "square", 0.06), 60);
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, "triangle", 0.07), i * 110));
  },
  lose: () => {
    [392, 311, 247].forEach((f, i) => setTimeout(() => blip(f, 0.22, "sine", 0.06), i * 130));
  },
  hint: () => blip(880, 0.1, "sine", 0.05),
};

export function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  const n = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  try { n.vibrate?.(pattern); } catch { /* noop */ }
}
