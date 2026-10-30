import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { BADGE_BEATS, Badges, BADGES_START } from "./scenes/Badges";
import { Build, BUILD_START, WIDGET_BEATS } from "./scenes/Build";
import { CUSTOM_CUES, CUSTOM_START, Customize } from "./scenes/Customize";
import { Intro, INTRO_START, Meet, MEET_START } from "./scenes/Intro";
import { Outro, OUTRO_START } from "./scenes/Outro";
import { PERK_BEATS, PREMIUM_BEAT, STARTER_BEAT, Token, TOKEN_START } from "./scenes/Token";
import { b, DURATION } from "./timing";

type Sfx = "whoosh" | "pop" | "click" | "tick" | "impact" | "riser" | "ding" | "chime" | "coin" | "stamp" | "snap";
type Cue = [frame: number, sfx: Sfx, volume?: number];

const RISER = 63; // riser.wav is 2.1 s: start it this many frames before the hit it leads into
const every = (from: number, to: number, step: number) => Array.from({ length: Math.max(0, Math.floor((to - from) / step)) }, (_, i) => from + i * step);

/** Every sound effect, at the frame it plays. The crescendo is in the density: pops get closer, ticks speed up, risers land on the hits. */
const CUES: Cue[] = [
  // Intro: bag, hard-cut statements, riser into the drop.
  [b(0), "pop", 1],
  [b(1.6), "whoosh", 0.7],
  ...[2, 3, 4, 5, 6].map((x): Cue => [b(x), "stamp", 0.8]),
  [b(7), "stamp", 1],
  [b(8) - RISER, "riser", 0.55],
  // Meet: the slam, then the three lines word by word.
  [b(8), "impact", 1],
  [b(11), "whoosh", 0.6],
  ...[12, 12.5, 13, 14, 14.5, 15, 16, 16.5, 17.5].map((x): Cue => [b(x), "pop", 0.6]),
  ...every(b(16.5), b(16.5) + 21, 2).map((f): Cue => [f, "tick", 0.35]),
  [b(19.3), "whoosh", 0.8],
  // Build: card rises, avatar, name typing, widgets faster and faster, three words, riser.
  [b(20), "whoosh", 0.8],
  [b(21), "pop", 0.8],
  ...every(b(21.5), b(21.5) + 8, 2).map((f): Cue => [f, "tick", 0.4]),
  ...WIDGET_BEATS.map((x, i): Cue => [b(x), "pop", 0.55 + i * 0.05]),
  [b(31.5), "whoosh", 0.6],
  ...[32, 34].map((x): Cue => [b(x), "stamp", 0.8]),
  [b(36), "stamp", 1],
  [b(40) - RISER, "riser", 0.6],
  // Customize: grab / drop, colors, video background.
  [b(CUSTOM_START), "whoosh", 0.5],
  [b(40.5), "pop", 0.5],
  ...CUSTOM_CUES.grabs.map((f): Cue => [b(CUSTOM_START) + f, "click", 0.8]),
  ...CUSTOM_CUES.drops.map((f): Cue => [b(CUSTOM_START) + f, "snap", 0.9]),
  ...CUSTOM_CUES.colors.map((f): Cue => [b(CUSTOM_START) + f, "click", 0.9]),
  [b(48.4), "pop", 0.5],
  [b(CUSTOM_START) + CUSTOM_CUES.video, "click", 0.9],
  [b(CUSTOM_START) + CUSTOM_CUES.video, "whoosh", 0.6],
  [b(52), "pop", 0.5],
  // Badges: title, then a chime or a pop on every eighth note, collapse.
  [b(BADGES_START), "stamp", 0.9],
  ...BADGE_BEATS.map((x, i): Cue => [b(x), i % 2 ? "pop" : "chime", i % 2 ? 0.55 : 0.45]),
  [b(62.5), "whoosh", 0.8],
  // Token: HOLD $FL3X, the counter ticking, Starter, riser, Premium, checkmark, perks.
  [b(TOKEN_START), "stamp", 1],
  [b(65), "coin", 0.8],
  [b(66.5), "whoosh", 0.5],
  ...every(b(67), b(STARTER_BEAT), 3).map((f): Cue => [f, "tick", 0.3]),
  [b(STARTER_BEAT), "ding", 0.9],
  [b(STARTER_BEAT), "coin", 0.6],
  ...every(b(STARTER_BEAT), b(PREMIUM_BEAT), 2).map((f): Cue => [f, "tick", 0.3]),
  [b(PREMIUM_BEAT) - RISER, "riser", 0.7],
  [b(PREMIUM_BEAT), "ding", 1],
  [b(PREMIUM_BEAT), "impact", 0.6],
  [b(80.5), "stamp", 1],
  ...PERK_BEATS.map((x): Cue => [b(x), "pop", 0.6]),
  // Outro: the final hit, the URL typing, the last line.
  [b(OUTRO_START), "impact", 1],
  ...every(b(86), b(86) + 16, 2).map((f): Cue => [f, "tick", 0.4]),
  [b(88), "pop", 0.6],
];

const SCENES: [start: number, end: number, Scene: () => React.ReactNode][] = [
  [INTRO_START, MEET_START, Intro],
  [MEET_START, BUILD_START, Meet],
  [BUILD_START, CUSTOM_START, Build],
  [CUSTOM_START, BADGES_START, Customize],
  [BADGES_START, TOKEN_START, Badges],
  [TOKEN_START, OUTRO_START, Token],
];

export function Launch({ music }: { music: string }) {
  return (
    // Moga's ligatures garble words ("YOUR" stacks its O and U): off everywhere, as on the site.
    <AbsoluteFill style={{ background: "#050505", fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "calt" 0, "dlig" 0' }}>
      {SCENES.map(([start, end, Scene]) => (
        <Sequence key={start} from={b(start)} durationInFrames={b(end) - b(start)}>
          <Scene />
        </Sequence>
      ))}
      <Sequence from={b(OUTRO_START)}>
        <Outro />
      </Sequence>

      {music && <Audio src={staticFile(music)} volume={0.85} />}
      {CUES.filter(([f]) => f >= 0 && f < DURATION).map(([f, sfx, volume = 1], i) => (
        <Sequence key={i} from={f} durationInFrames={90}>
          <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
