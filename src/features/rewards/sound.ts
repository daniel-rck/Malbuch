// The sticker jingle (spec §3.3): a few soft notes synthesised with WebAudio,
// so there is no audio file to precache. Browsers only let audio start after
// a user gesture: the context is made and resumed on the first touch.

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (context) return context;
  const Ctor = globalThis.AudioContext as typeof AudioContext | undefined;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

function wake(): void {
  const ctx = audio();
  if (ctx?.state === "suspended") void ctx.resume().catch(() => {});
}

/** Call once at startup: wakes the audio context on every pointerdown. */
export function primeSound(): () => void {
  window.addEventListener("pointerdown", wake, { capture: true });
  return () => window.removeEventListener("pointerdown", wake, { capture: true });
}

/** C – E – G – C: a rising major arpeggio. */
const STICKER = [523.25, 659.25, 783.99, 1046.5];
/** A sparkle for a surprise page: G – C – E – G – C, quicker. */
const UNLOCK = [783.99, 1046.5, 1318.5, 1568, 2093];

export function playJingle(kind: "sticker" | "unlock" = "sticker"): void {
  const ctx = audio();
  if (!ctx || ctx.state !== "running") return;
  const notes = kind === "unlock" ? UNLOCK : STICKER;
  const step = kind === "unlock" ? 0.09 : 0.12;
  const start = ctx.currentTime + 0.02;
  const out = ctx.createGain();
  out.gain.value = 0.18;
  out.connect(ctx.destination);
  notes.forEach((freq, i) => {
    const t = start + i * step;
    const last = i === notes.length - 1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (last ? 0.5 : 0.22));
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + (last ? 0.55 : 0.25));
  });
}
