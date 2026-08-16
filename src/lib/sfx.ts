/**
 * Lightweight procedural sound design (Web Audio, no assets, no music).
 * Muted by default — nothing plays until the user enables sound.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
const listeners = new Set<(on: boolean) => void>();

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isSoundOn() {
  return enabled;
}

export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toggleSound() {
  enabled = !enabled;
  if (enabled) ensure();
  listeners.forEach((l) => l(enabled));
  if (enabled) tone({ freq: 660, dur: 0.14, type: "sine", gain: 0.09 });
  return enabled;
}

type ToneOpts = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  delay?: number;
};

function tone({
  freq,
  dur,
  type = "sine",
  gain = 0.12,
  slideTo,
  delay = 0,
}: ToneOpts) {
  const c = enabled ? ensure() : null;
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.04, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, gain = 0.09, filterFreq = 1200, q = 0.8) {
  const c = enabled ? ensure() : null;
  if (!c || !master) return;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = filterFreq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export const sfx = {
  drop: () => tone({ freq: 900, slideTo: 300, dur: 0.28, type: "sine", gain: 0.1 }),
  impact: () => {
    tone({ freq: 180, slideTo: 60, dur: 0.5, type: "sine", gain: 0.16 });
    noise(0.22, 0.06, 700);
  },
  bubble: () =>
    tone({
      freq: 420 + Math.random() * 420,
      slideTo: 900,
      dur: 0.1,
      type: "sine",
      gain: 0.045,
    }),
  reaction: () => {
    noise(1.4, 0.035, 500, 0.6);
    tone({ freq: 90, slideTo: 220, dur: 1.6, type: "triangle", gain: 0.05 });
  },
  equation: () =>
    tone({ freq: 1500, dur: 0.09, type: "triangle", gain: 0.03 }),
  hoof: () => {
    tone({ freq: 130, slideTo: 55, dur: 0.14, type: "sine", gain: 0.09 });
    noise(0.08, 0.03, 2200);
  },
  whoosh: () => noise(0.6, 0.07, 900, 0.5),
  burst: () => {
    noise(1.1, 0.09, 1600, 0.4);
    tone({ freq: 320, slideTo: 1200, dur: 0.7, type: "sine", gain: 0.07 });
  },
  reveal: () => {
    tone({ freq: 523, dur: 0.9, type: "sine", gain: 0.07 });
    tone({ freq: 784, dur: 1.1, type: "sine", gain: 0.05, delay: 0.12 });
    tone({ freq: 1046, dur: 1.3, type: "sine", gain: 0.04, delay: 0.26 });
  },
  tap: () => tone({ freq: 720, dur: 0.07, type: "triangle", gain: 0.05 }),
  open: () => {
    noise(0.5, 0.06, 1100);
    tone({ freq: 240, slideTo: 700, dur: 0.5, type: "sine", gain: 0.07 });
  },
};
