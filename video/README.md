# FL3X launch video

Motion design for the $FL3X launch, made with [Remotion](https://remotion.dev) (React → MP4).
1920×1080, 30 fps, ~43 s.

## Render

```bash
npm install
node scripts/audio.mjs      # regenerates the SFX and the placeholder beat
npx remotion render src/index.ts Launch out/fl3x-launch.mp4 --crf=18
npx remotion studio src/index.ts   # live preview + timeline
```

Rendering uses the installed Google Chrome (see `remotion.config.ts`): Remotion's own
headless Chrome never finishes loading on this Mac.

## Swap the music

Everything is cut on a beat grid (`src/timing.ts`), so the edit follows the track:

1. Put the track in `public/music/` (mp3 or wav).
2. In `src/Root.tsx`, set `defaultProps={{ music: "music/<file>" }}`.
3. In `src/timing.ts`, set `BPM` to the track's tempo and `OFFSET` to the seconds before
   its first downbeat. The drop lands on beat 8, the build on 20–40, Premium on 80 and the
   final hit on 84: pick a section of the track where those fall nicely (or trim the track).

## Structure

| Beats | Scene | File |
| --- | --- | --- |
| 0–8 | The bag, then "YOUR BAGS. / YOUR WINS. / … / ONE LINK." | `scenes/Intro.tsx` |
| 8–20 | FL3X slams in; "Your profile, live widgets, one link." with UI inline | `scenes/Intro.tsx` (`Meet`) |
| 20–40 | The profile builds, widgets drop in faster and faster | `scenes/Build.tsx` |
| 40–56 | Customize: drag & drop, recolor, video background | `scenes/Customize.tsx` |
| 56–64 | Badges | `scenes/Badges.tsx` |
| 64–84 | Hold $FL3X: Free → Starter (100K) → Premium (1M), perks | `scenes/Token.tsx` |
| 84–96 | Logo, fl3x.lol, "Claim your name." | `scenes/Outro.tsx` |

Sound effects are synthesized (`scripts/audio.mjs`, no samples or licences) and placed in
`src/Launch.tsx` (`CUES`). Text animations and the cursor come partly from
[snapcn](https://snapcn.dev) (`src/components/snap-cn`, MIT).
