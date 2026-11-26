import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { createStudio, type FrameFn, type Studio, type StudioOptions } from "./studio";
import type { Shot } from "./math";
import { shotAt } from "./math";

/**
 * The blue grid studio as a Remotion layer.
 *
 * `setup` runs once: build your props, load the man, and return a frame function. The frame function takes the time in
 * seconds, puts everything where it is at that moment, and returns the camera for that moment. It must be pure (same t,
 * same picture), because frames are rendered out of order and several times each for motion blur.
 *
 *   <MythStage setup={async (studio) => { const man = await loadMan(studio, { base: staticFile("myth/") }); return (t) => {...; return cam} }} />
 *
 * `samples`: sub-frames per frame. 1 = fastest (blocking), 4 = default, 12-20 = final quality (motion blur + lens blur).
 * `shots`: pass the shot list so motion blur never smears across a cut.
 */
export const MythStage: React.FC<{ setup: (studio: Studio) => Promise<FrameFn> | FrameFn; samples?: number; shots?: Shot[]; studio?: StudioOptions }> = ({ setup, samples = 4, shots, studio: studioOpts }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ studio: Studio; fn: FrameFn } | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading the myth studio (character, clips, textures)", { timeoutInMilliseconds: 120000 }));

  useEffect(() => {
    let dead = false;
    const studio = createStudio(canvasRef.current!, { width, height, ...studioOpts });
    Promise.resolve(setup(studio))
      .then((fn) => {
        if (dead) return;
        state.current = { studio, fn };
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => { console.error(e); throw e; });
    return () => { dead = true; state.current = null; studio.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw synchronously in the commit, so the canvas is finished before Remotion takes its screenshot of this frame.
  useLayoutEffect(() => {
    const s = state.current;
    if (!ready || !s) return;
    const t = frame / fps;
    const sh = shots ? shotAt(shots, t) : null;
    s.studio.render(t, s.fn, samples, fps, sh ? sh.t0 : -Infinity, sh ? sh.t1 : Infinity);
  }, [frame, fps, ready, samples, shots]);

  return (
    <AbsoluteFill style={{ background: "#061a36" }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ width, height, display: "block" }} />
    </AbsoluteFill>
  );
};
