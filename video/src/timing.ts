/**
 * The edit is cut on a beat grid: every cue is in beats, so swapping in the
 * real track only means changing BPM (and OFFSET if the first downbeat isn't at 0).
 */
export const FPS = 30;
export const BPM = 140;
/** Seconds before the first downbeat of the music. */
export const OFFSET = 0;
export const TOTAL_BEATS = 96;

/** Frame of a beat (fractions allowed: 0.5 = an eighth note later). */
export const b = (beat: number) => Math.round((OFFSET + (beat * 60) / BPM) * FPS);
export const DURATION = b(TOTAL_BEATS) + FPS; // one second of tail after the last beat
