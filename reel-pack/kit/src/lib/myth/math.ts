// Small pure helpers. Every frame is a pure function of t (seconds): no clocks, no Math.random(), no state carried between frames.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0 before a, 1 after b, straight line between. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const smooth = (k: number) => k * k * (3 - 2 * k);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
/** Overshoot then settle (pops, landings): k 0..1. */
export const backOut = (k: number, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
/** Damped spring for a hit at time a: 0 before, wobbles, settles at 0. */
export const spring = (t: number, a: number, freq = 7, decay = 6) => (t < a ? 0 : Math.sin((t - a) * freq * Math.PI * 2) * Math.exp(-(t - a) * decay));
/**
 * Recoil pulse: a sharp kick at time d that decays, plus a small damped spring after it.
 * Run it down a chain with growing delays (hand 0 ms, shoulder 12 ms, chest 25 ms, head 40 ms) so the hit travels through the body.
 */
export const kick = (s: number, d = 0) => (s < d ? 0 : Math.exp(-(s - d) * 14) * smooth(seg(s, d, d + 0.008)) + spring(s, d, 4.5, 8) * 0.35);
/** Low-discrepancy sequence: spreads sub-frame samples evenly (motion blur, lens blur, soft light). */
export const halton = (i: number, b: number) => {
  let f = 1, r = 0;
  while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); }
  return r;
};
/** Seeded "random": same input, same number, every render. */
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** Slow layered drift in -1..1 (never repeats visibly): idle life on any channel. */
export const drift = (t: number, s: number) => Math.sin(t * 0.83 + s) * 0.5 + Math.sin(t * 1.37 + s * 2.1) * 0.3 + Math.sin(t * 2.9 + s * 3.3) * 0.2;
/** One blink (0..1..0) starting at `at`, `d` seconds long. */
export const blinkPulse = (u: number, at: number, d = 0.16) => (u > at && u < at + d ? Math.sin(((u - at) / d) * Math.PI) : 0);
/** A blink schedule on a character's own clock: every 2.4-4.2 s, 0.16 s long. */
export const blinkAt = (t: number) => {
  let k = 0;
  for (let i = 0; i < 40; i++) { const tb = 0.7 + i * 3.1 + (hash(i * 3.7) - 0.5) * 1.6; k = Math.max(k, blinkPulse(t, tb)); }
  return k;
};

/** A shot on the timeline. t0/t1 in seconds. */
export type Shot = { id: string; t0: number; t1: number };
/** Build a shot list from lengths: shots([["A1", 0.9], ["A2", 1.0]]) -> t0/t1 filled in. Throws if a shot is under 0.6 s. */
export const shots = (list: [string, number][]): Shot[] => {
  let t = 0;
  return list.map(([id, d]) => {
    if (d < 0.6 - 1e-6) throw new Error(`shot ${id} is ${d} s: nothing under 0.6 s`);
    const s = { id, t0: t, t1: t + d };
    t += d;
    return s;
  });
};
export const shotAt = (list: Shot[], t: number): Shot => {
  for (const s of list) if (t >= s.t0 - 1e-6 && t < s.t1 - 1e-6) return s;
  return list[list.length - 1];
};
