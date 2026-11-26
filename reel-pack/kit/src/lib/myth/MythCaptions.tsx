import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import "@fontsource/montserrat/800.css";

/** One caption chunk: the time (seconds) its first word is spoken, and 1-3 words. An empty string clears the screen. */
export type Chunk = [number, string];

/**
 * The only text on screen in this format: white heavy all-caps with a dark outline, centred, sitting at about two thirds of
 * the frame height (baseline y 1313 of 1920, so the centre is near y 1285), 1-3 words, changing on the spoken word.
 * No fade, no bounce: the words simply swap. Keep this band clear in every shot (no prop, hand or bright line behind it).
 * Throws if a chunk has more than 3 words, so a long caption can never reach a render.
 */
export const MythCaptions: React.FC<{ chunks: Chunk[]; size?: number; baseline?: number; color?: string }> = ({ chunks, size = 80, baseline = 1313, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  for (const [, s] of chunks) if (s.trim().split(/\s+/).filter(Boolean).length > 3) throw new Error(`caption "${s}" has more than 3 words`);
  const t = frame / fps;
  let txt = "";
  for (const [a, s] of chunks) if (t >= a - 1e-6) txt = s;
  if (!txt) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: baseline - size, height: size * 1.25, textAlign: "center", whiteSpace: "nowrap",
          fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif", fontWeight: 800, fontSize: size, lineHeight: `${size * 1.25}px`, letterSpacing: 0,
          color, textTransform: "uppercase", WebkitTextStroke: "15px rgba(8,12,22,0.92)", paintOrder: "stroke fill",
        }}
      >
        {txt}
      </div>
    </AbsoluteFill>
  );
};

/** Turn a slash-marked line into evenly paced chunks: "IF YOU / ROLLED / A BALL" at `wpm` words a minute from `start`. For drafts before there is a voice; with a voice, use the real word times. */
export function paceChunks(line: string, start = 0, wpm = 190): Chunk[] {
  let t = start;
  const out: Chunk[] = [];
  for (const c of line.split("/").map((x) => x.trim()).filter(Boolean)) {
    out.push([+t.toFixed(3), c.toUpperCase()]);
    t += (c.split(/\s+/).length * 60) / wpm;
  }
  return out;
}
