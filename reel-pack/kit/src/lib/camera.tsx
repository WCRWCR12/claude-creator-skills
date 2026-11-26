import React from "react";
import { useThree } from "@react-three/fiber";
import { Easing, useCurrentFrame } from "remotion";
import * as THREE from "three";

/**
 * Camera keyframes. The camera move IS the animation: plan it first (start pose -> end pose -> ease -> duration).
 * f = frame number, pos = camera position (metres), look = point the camera aims at, fov = vertical field of view.
 * Lens feel on a 9:16 frame: fov 60+ = wide/establishing, 35-45 = normal, 20-28 = long lens/compressed.
 */
export type CamKey = {
  f: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov?: number;
  /** easing INTO this key from the previous one. Default: smooth in-out. */
  ease?: (t: number) => number;
  /** set by orbitKey(): when two neighbouring keys both have it, the camera travels round the arc
   *  (angle, radius and height interpolated) instead of cutting straight through the subject. */
  orbit?: { target: [number, number, number]; radius: number; angleDeg: number; height: number };
};

export const EASE = {
  smooth: Easing.bezier(0.45, 0, 0.2, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.6, 0, 0.9, 0.4),
  linear: (t: number) => t,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Sample the camera path at any frame (pure function of the frame: renders are deterministic). */
export function sampleCamera(keys: CamKey[], frame: number) {
  const k = [...keys].sort((a, b) => a.f - b.f);
  if (frame <= k[0].f) return { pos: k[0].pos, look: k[0].look, fov: k[0].fov ?? 40 };
  const last = k[k.length - 1];
  if (frame >= last.f) return { pos: last.pos, look: last.look, fov: last.fov ?? 40 };
  let i = 0;
  while (k[i + 1].f < frame) i++;
  const a = k[i];
  const b = k[i + 1];
  const t = (b.ease ?? EASE.smooth)((frame - a.f) / (b.f - a.f));
  if (a.orbit && b.orbit) {
    const target = lerp3(a.orbit.target, b.orbit.target, t);
    const ang = (lerp(a.orbit.angleDeg, b.orbit.angleDeg, t) * Math.PI) / 180;
    const r = lerp(a.orbit.radius, b.orbit.radius, t);
    const pos: [number, number, number] = [target[0] + Math.sin(ang) * r, lerp(a.orbit.height, b.orbit.height, t), target[2] + Math.cos(ang) * r];
    return { pos, look: lerp3(a.look, b.look, t), fov: lerp(a.fov ?? 40, b.fov ?? 40, t) };
  }
  return { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov ?? 40, b.fov ?? 40, t) };
}

/** Orbit helper: a camera key on a circle around a target. angleDeg 0 = +Z side, 90 = +X side.
 *  Consecutive orbitKeys travel round the arc (e.g. 30 -> 210 = a half orbit). For a full 360 use 0 -> 360. */
export function orbitKey(
  f: number,
  target: [number, number, number],
  radius: number,
  angleDeg: number,
  height: number,
  fov = 40,
  ease?: (t: number) => number,
): CamKey {
  const a = (angleDeg * Math.PI) / 180;
  return {
    f,
    pos: [target[0] + Math.sin(a) * radius, height, target[2] + Math.cos(a) * radius],
    look: target,
    fov,
    ease,
    orbit: { target, radius, angleDeg, height },
  };
}

/**
 * How far the camera must be to fit a subject on a 9:16 frame.
 * width/height = the subject's size AS SEEN from the camera (side-on tank: its length; head-on: its width).
 * fill = fraction of the frame the subject should fill (0.75 = establishing, 1.2+ = close-up that crops).
 * Example: a 6.6 m tank side-on at fov 38 needs ~22 m; a 1.4 x 4.8 m stone ~9 m.
 */
export function fitDistance(width: number, height: number, fovDeg = 40, fill = 0.75, aspect = 9 / 16): number {
  const v = (fovDeg * Math.PI) / 180;
  const h = 2 * Math.atan(Math.tan(v / 2) * aspect);
  const dw = width / fill / 2 / Math.tan(h / 2);
  const dh = height / fill / 2 / Math.tan(v / 2);
  return Math.max(dw, dh);
}

/** Screen shake: damped, seeded, frame-locked. hits = frames where something big happens. */
export function shakeOffset(frame: number, hits: { f: number; strength?: number }[], fps = 30): [number, number, number] {
  let x = 0, y = 0, z = 0;
  for (const h of hits) {
    const dt = (frame - h.f) / fps;
    if (dt < 0 || dt > 1.2) continue;
    const amp = (h.strength ?? 0.12) * Math.exp(-dt * 5.5);
    x += amp * Math.sin(dt * 71 + h.f) ;
    y += amp * 0.8 * Math.sin(dt * 53 + h.f * 1.7);
    z += amp * 0.4 * Math.sin(dt * 37 + h.f * 0.3);
  }
  return [x, y, z];
}

/** Handheld micro-drift so a "locked" camera still breathes. amp in metres. */
export function handheld(frame: number, amp = 0.01): [number, number, number] {
  const t = frame / 30;
  return [
    amp * (Math.sin(t * 1.3) + 0.5 * Math.sin(t * 2.9 + 1)),
    amp * (Math.sin(t * 1.7 + 2) + 0.5 * Math.sin(t * 3.3)),
    0,
  ];
}

/** Drop inside <ThreeCanvas>. Drives the default camera from keys every frame. */
export const CameraRig: React.FC<{
  keys: CamKey[];
  hits?: { f: number; strength?: number }[];
  drift?: number;
}> = ({ keys, hits = [], drift = 0.008 }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { pos, look, fov } = sampleCamera(keys, frame);
  const s = shakeOffset(frame, hits);
  const d = handheld(frame, drift);
  camera.position.set(pos[0] + s[0] + d[0], pos[1] + s[1] + d[1], pos[2] + s[2]);
  camera.fov = fov;
  camera.near = 0.05;
  camera.far = 2000;
  camera.updateProjectionMatrix();
  camera.lookAt(look[0] + s[0] * 0.5, look[1] + s[1] * 0.5, look[2]);
  return null;
};
