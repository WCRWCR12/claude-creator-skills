import React from "react";
import { Composition } from "remotion";
import { HeroShot } from "./scenes/HeroShot";
import { MythTwoBalls, MYTH_TWO_BALLS_SECONDS } from "./scenes/MythTwoBalls";

// Every reel is 1080x1920 (9:16) at 30 fps. Add one <Composition> per scene or per reel.
export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const Root: React.FC = () => {
  return (
    <>
      {/* Example scene: a lit object on a plinth, a camera move through the set, a hit with sparks,
          screen shake, a lower-third title, film grain and SFX. Copy it to start a new scene. */}
      <Composition id="HeroShot" component={HeroShot} durationInFrames={6 * FPS} fps={FPS} width={W} height={H} />
      {/* Example of the myth-explainer format: the man in the blue grid studio, 11 one-second shots, 1-3 word captions,
          a quiet held pad. Copy src/scenes/MythTwoBalls.tsx to start a myth scene. samples: 1 = fast draft, 12+ = final. */}
      <Composition id="MythTwoBalls" component={MythTwoBalls} durationInFrames={Math.round(MYTH_TWO_BALLS_SECONDS * FPS)} fps={FPS} width={W} height={H} defaultProps={{ samples: 6 }} />
    </>
  );
};
