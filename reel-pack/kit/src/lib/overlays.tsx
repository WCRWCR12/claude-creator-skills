import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * 2D layers drawn over the 3D canvas.
 * House rule: persistent text lives in the LOWER THIRD (y 1200-1680 on a 1920 frame).
 * The top ~400 px is covered by the app's username/audio strip; below 1760 by the like/comment icons and caption.
 */
const FONT = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export const LowerThird: React.FC<{ text: string; from: number; to?: number; sub?: string; accent?: string }> = ({
  text,
  from,
  to = 99999,
  sub,
  accent = "#f2b544",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from || frame > to + 10) return null;
  const inK = spring({ frame: frame - from, fps, config: { damping: 16, stiffness: 160 } });
  const outK = frame > to ? interpolate(frame, [to, to + 10], [1, 0], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 1330,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: outK,
          transform: `translateY(${(1 - inK) * 40}px)`,
        }}
      >
        <div
          style={{
            background: "rgba(14,14,16,0.78)", // flat scrim for legibility, not a decorative gradient
            color: "#fff",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 64,
            lineHeight: 1.1,
            padding: "18px 34px",
            borderRadius: 18,
            textAlign: "center",
            borderBottom: `6px solid ${accent}`,
          }}
        >
          {text}
        </div>
        {sub && (
          <div style={{ marginTop: 16, color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 40, textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
            {sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Word-by-word caption with the live word highlighted. words = [{w, s, e}] in seconds (from a transcript). */
export const WordCaptions: React.FC<{ words: { w: string; s: number; e: number }[]; perLine?: number; top?: number }> = ({ words, perLine = 3, top = 1420 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = words.findIndex((x) => t >= x.s && t < x.e + 0.25);
  if (idx < 0) return null;
  const start = Math.floor(idx / perLine) * perLine;
  const group = words.slice(start, start + perLine);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top, left: 80, right: 80, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 70, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.8)" }}>
        {group.map((x, i) => (
          <span key={i} style={{ color: start + i === idx ? "#f2b544" : "#fff", margin: "0 10px" }}>
            {x.w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Film grain: seeded per frame, very light. Gives texture without a "filter" look. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const id = `grain${frame}`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Subtle full-frame flash for a big hit (a few frames). Keep it soft: hard white flashes hurt on a phone. */
export const HitFlash: React.FC<{ at: number; color?: string; strength?: number }> = ({ at, color = "#fff3d6", strength = 0.35 }) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < 0 || f > 4) return null;
  return <AbsoluteFill style={{ background: color, opacity: strength * (1 - f / 5), pointerEvents: "none" }} />;
};
