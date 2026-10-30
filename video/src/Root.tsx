import { Composition } from "remotion";
import { Launch } from "./Launch";
import { DURATION, FPS } from "./timing";

export function Root() {
  return (
    <Composition id="Launch" component={Launch} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} defaultProps={{ music: "music/beat.wav" }} />
  );
}
