// Synthesizes every sound of the launch video: the SFX (public/sfx/*.wav) and a
// placeholder trap beat (public/music/beat.wav) built on the same grid as the
// edit (BPM in src/timing.ts). No samples, no licences: it's all math.
// Run: node scripts/audio.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const SR = 48000;
const BPM = 140;
const BEAT = 60 / BPM;
const TOTAL_BEATS = 96;

// ---------------------------------------------------------------- helpers

const buf = (seconds) => new Float32Array(Math.ceil(seconds * SR));
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const noteHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function writeWav(path, ...channels) {
  const [l, r = l] = channels;
  const n = l.length;
  // Soft limiter: loud but never clipping.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const gain = peak > 0 ? 0.98 / Math.max(peak, 1e-9) : 1;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(Math.tanh(l[i] * gain * 1.1) * 32000), i * 4);
    data.writeInt16LE(Math.round(Math.tanh(r[i] * gain * 1.1) * 32000), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}

/** One-pole low-pass with a cutoff that can move over time (Hz, per sample). */
function lowpass(x, cutoff) {
  const out = new Float32Array(x.length);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof cutoff === "function" ? cutoff(i / SR) : cutoff;
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    y += a * (x[i] - y);
    out[i] = y;
  }
  return out;
}
const highpass = (x, fc) => {
  const lp = lowpass(x, fc);
  return x.map((v, i) => v - lp[i]);
};
const mixInto = (dst, src, at, gain = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * gain;
};
const noise = (s) => buf(s).map(() => rand());
const env = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

/** Sine with a pitch that follows f(t), phase-continuous. */
function sweep(seconds, f, amp = (t) => 1, shape = Math.sin) {
  const out = buf(seconds);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * f(t)) / SR;
    out[i] = shape(ph) * amp(t);
  }
  return out;
}
const saw = (ph) => ((ph / (2 * Math.PI)) % 1) * 2 - 1;

/** Short room so dry synths sit in a space (two quiet feedback delays). */
function room(x, mix = 0.18) {
  const out = Float32Array.from(x);
  for (const [ms, g] of [[23, 0.45], [37, 0.38], [53, 0.3]]) {
    const d = Math.round((ms / 1000) * SR);
    for (let i = d; i < out.length; i++) out[i] += out[i - d] * g * mix;
  }
  return out;
}

// ---------------------------------------------------------------- SFX

mkdirSync("public/sfx", { recursive: true });
mkdirSync("public/music", { recursive: true });

const sfx = {
  // Air passing by: band of noise sweeping up then down.
  whoosh: () => {
    const s = 0.55;
    const x = lowpass(noise(s), (t) => 300 + 5200 * Math.sin(Math.PI * Math.min(1, t / s)) ** 2);
    return x.map((v, i) => v * Math.sin(Math.PI * Math.min(1, i / SR / s)) ** 1.5 * 1.6);
  },
  // Bubble pop: pitch drop + tiny click.
  pop: () => {
    const p = sweep(0.14, (t) => 1100 * Math.exp(-t * 28) + 260, (t) => env(t, 0.002, 0.035));
    mixInto(p, highpass(noise(0.01), 3000), 0, 0.25);
    return p;
  },
  // UI click.
  click: () => {
    const c = highpass(noise(0.03), 2500).map((v, i) => v * Math.exp(-i / SR / 0.006));
    mixInto(c, sweep(0.03, () => 3200, (t) => Math.exp(-t / 0.008)), 0, 0.4);
    return c;
  },
  // Counter tick.
  tick: () => sweep(0.025, () => 4200, (t) => Math.exp(-t / 0.005)),
  // Big hit: sub drop + thump + noise burst + tail.
  impact: () => {
    const s = 1.6;
    const sub = sweep(s, (t) => 38 + 70 * Math.exp(-t * 9), (t) => env(t, 0.003, 0.45));
    mixInto(sub, lowpass(noise(0.35), (t) => 4000 * Math.exp(-t * 10) + 200).map((v, i) => v * Math.exp(-i / SR / 0.09)), 0, 0.9);
    mixInto(sub, sweep(0.12, (t) => 160 * Math.exp(-t * 20) + 60, (t) => env(t, 0.001, 0.04)), 0, 0.8);
    return room(sub, 0.25);
  },
  // Rising tension: noise + saw that climb for 2 s.
  riser: () => {
    const s = 2.1;
    const n = lowpass(noise(s), (t) => 400 + 9000 * (t / s) ** 2).map((v, i) => v * (i / SR / s) ** 1.6);
    const tone = sweep(s, (t) => 180 * 2 ** ((t / s) * 3), (t) => (t / s) ** 2 * 0.35, saw);
    mixInto(n, lowpass(tone, 3000), 0, 0.8);
    return n;
  },
  // Unlock: bright bell (inharmonic partials).
  ding: () => {
    const s = 1.4;
    const out = buf(s);
    for (const [ratio, g, d] of [[1, 1, 0.5], [2.76, 0.5, 0.25], [5.4, 0.25, 0.12], [8.93, 0.12, 0.06]])
      mixInto(out, sweep(s, () => 1046.5 * ratio, (t) => env(t, 0.001, d) * g), 0);
    return room(out, 0.3);
  },
  // Badge sparkle: three quick bell notes up a chord.
  chime: () => {
    const out = buf(0.9);
    [84, 88, 91].forEach((m, k) => {
      const n = buf(0.6);
      for (const [ratio, g, d] of [[1, 1, 0.22], [2.76, 0.35, 0.1]]) mixInto(n, sweep(0.6, () => noteHz(m) * ratio, (t) => env(t, 0.001, d) * g), 0);
      mixInto(out, n, k * 0.045, 0.6);
    });
    return room(out, 0.3);
  },
  // Coin: two square-ish blips (B5 → E6).
  coin: () => {
    const sq = (ph) => Math.tanh(Math.sin(ph) * 4);
    const out = buf(0.45);
    mixInto(out, sweep(0.08, () => noteHz(83), (t) => env(t, 0.001, 0.05), sq), 0, 0.5);
    mixInto(out, sweep(0.4, () => noteHz(88), (t) => env(t, 0.001, 0.12), sq), 0.07, 0.5);
    return out;
  },
  // Stamp: short hard hit for the checkmark landing.
  stamp: () => {
    const out = sweep(0.25, (t) => 220 * Math.exp(-t * 30) + 70, (t) => env(t, 0.001, 0.05));
    mixInto(out, lowpass(noise(0.08), 3500).map((v, i) => v * Math.exp(-i / SR / 0.015)), 0, 0.7);
    return room(out, 0.2);
  },
  // Snap for drag-and-drop landing.
  snap: () => {
    const out = sweep(0.09, (t) => 600 * Math.exp(-t * 40) + 180, (t) => env(t, 0.001, 0.02));
    mixInto(out, highpass(noise(0.02), 4000).map((v, i) => v * Math.exp(-i / SR / 0.004)), 0, 0.5);
    return out;
  },
};
for (const [name, make] of Object.entries(sfx)) writeWav(`public/sfx/${name}.wav`, make());

// ---------------------------------------------------------------- beat
// Placeholder track until the real one arrives: F minor trap at 140 BPM.
// Sections follow the edit (beats): 0-8 intro, 8 drop, 20-40 build with rolls,
// 40-64 groove, 64-80 tension, 80 peak, 84 final hit, 88+ outro.

const len = TOTAL_BEATS * BEAT + 2.5;
const L = buf(len);
const R = buf(len);
const both = (src, at, gain = 1, pan = 0) => {
  mixInto(L, src, at, gain * (1 - Math.max(0, pan)));
  mixInto(R, src, at, gain * (1 + Math.min(0, pan)));
};
const t = (beat) => beat * BEAT;

const kick = () => {
  const k = sweep(0.45, (x) => 46 + 140 * Math.exp(-x * 35), (x) => env(x, 0.002, 0.18));
  mixInto(k, highpass(noise(0.01), 2000), 0, 0.3);
  return k;
};
const clap = () => {
  const c = buf(0.3);
  for (const o of [0, 0.011, 0.022]) mixInto(c, lowpass(highpass(noise(0.2), 900), 5000).map((v, i) => v * Math.exp(-i / SR / (o === 0.022 ? 0.08 : 0.01))), o);
  return room(c, 0.35);
};
const hat = (open = false) => highpass(noise(open ? 0.25 : 0.05), 7000).map((v, i) => v * Math.exp(-i / SR / (open ? 0.07 : 0.012)));
const bass808 = (midi, dur, glideFrom) =>
  sweep(
    dur,
    (x) => noteHz(midi) * (glideFrom && x < 0.08 ? 2 ** ((glideFrom - midi) / 12 * (1 - x / 0.08)) : 1),
    (x) => env(x, 0.004, 0.9) * (x > dur - 0.05 ? (dur - x) / 0.05 : 1),
    (ph) => Math.tanh(Math.sin(ph) * 2.2),
  );
const pad = (midis, dur) => {
  const out = buf(dur);
  for (const m of midis)
    for (const det of [-0.08, 0.08])
      mixInto(out, sweep(dur, () => noteHz(m + det), (x) => Math.min(1, x / 0.3) * Math.min(1, (dur - x) / 0.4) * 0.18, saw), 0);
  return lowpass(out, 1400);
};

// Chords per bar (4 beats): Fm, Db, Ab, Eb.
const CHORDS = [[53, 56, 60], [49, 53, 56], [56, 60, 63], [51, 55, 58]];
const BASS = [29, 25, 32, 27];

for (let bar = 0; bar < TOTAL_BEATS / 4; bar++) {
  const b0 = bar * 4;
  const chord = CHORDS[bar % 4];
  const outro = b0 >= 88;
  // Pad all along, quieter under the busy parts.
  both(pad(chord, 4 * BEAT + 0.3), t(b0), b0 < 8 || outro ? 1 : 0.55);
  if (b0 < 8 || outro) continue;

  const tension = b0 >= 64 && b0 < 80;
  // Kick: trap pattern (1, the "and" of 2, 3½ variations).
  for (const k of tension ? [0, 2] : [0, 1.5, 2.75, 3.5]) both(kick(), t(b0 + k), 0.95);
  // Clap on 2 and 4 (half-time feel: on 3 during the tension part).
  for (const c of tension ? [2] : [1, 3]) both(clap(), t(b0 + c), 0.5);
  // Hats: 8ths, 16ths in the build, triplet rolls at the ends of phrases.
  const step = b0 >= 20 && b0 < 40 ? 0.25 : 0.5;
  for (let h = 0; h < 4; h += step) both(hat(), t(b0 + h), 0.16, h % 1 ? 0.3 : -0.3);
  if ([36, 60, 76].includes(b0)) for (let h = 3; h < 4; h += 1 / 6) both(hat(), t(b0 + h), 0.2);
  if (b0 % 8 === 4) both(hat(true), t(b0 + 3.5), 0.12);
  // 808
  both(bass808(BASS[bar % 4], 2 * BEAT, bar % 2 ? BASS[(bar + 3) % 4] : undefined), t(b0), 0.75);
  if (!tension) both(bass808(BASS[bar % 4] + 12, BEAT * 0.9), t(b0 + 2.75), 0.45);
}
// Snare roll into the peak (beats 78-80) and the final hit (84).
for (let s = 0; s < 16; s++) both(clap(), t(78 + s / 8), 0.12 + s * 0.02);

writeWav("public/music/beat.wav", L, R);
console.log("sfx:", Object.keys(sfx).join(", "), "| beat:", len.toFixed(1), "s");
