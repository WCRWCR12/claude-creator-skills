import React, { useMemo } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

/**
 * Effects that are pure functions of the frame (seeded randomness only, never Math.random):
 * renders are identical every time and can be split across Chrome tabs.
 * Every effect takes `at` (the frame it starts) and a world position.
 */

type V3 = [number, number, number];

/** Muzzle flash / explosion core: a 2-4 frame bright burst + a point light that lights the scene. */
export const Flash: React.FC<{
  at: number;
  position: V3;
  size?: number;
  color?: string;
  light?: number;
  frames?: number;
  /** muzzle streak direction (unit vector), e.g. the barrel axis. Omit for a round burst. */
  streak?: V3;
}> = ({ at, position, size = 1, color = "#ffd27a", light = 60, frames = 4, streak }) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > frames + 6) return null;
  const k = f <= frames ? 1 - f / (frames + 1) : 0;
  const lightK = Math.exp(-Math.max(0, f) / 2.5);
  return (
    <group position={position}>
      {k > 0 && (
        <>
          <mesh scale={size * (0.35 + 0.6 * (1 - k))}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color={color} transparent opacity={k} toneMapped={false} depthWrite={false} />
          </mesh>
          {streak && (
            <mesh
              position={[streak[0] * size * 1.4, streak[1] * size * 1.4, streak[2] * size * 1.4]}
              quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...streak).normalize())}
              scale={[size * 2.4 * (1.2 - k * 0.4), size * 0.45, size * 0.45]}
            >
              <sphereGeometry args={[1, 16, 12]} />
              <meshBasicMaterial color="#fff2c8" transparent opacity={k * 0.9} toneMapped={false} depthWrite={false} />
            </mesh>
          )}
        </>
      )}
      <pointLight color={color} intensity={light * lightK} distance={size * 25} decay={2} />
    </group>
  );
};

/** Smoke that billows out, rises, drifts with the wind and thins. */
export const Smoke: React.FC<{
  at: number;
  position: V3;
  count?: number;
  spread?: number;
  rise?: number;
  wind?: V3;
  color?: string;
  life?: number; // seconds
  size?: number;
  seed?: string;
  direction?: V3; // initial push (e.g. the barrel's direction)
}> = ({ at, position, count = 26, spread = 1, rise = 1.2, wind = [0.6, 0, 0.2], color = "#9a928a", life = 4, size = 1, seed = "smoke", direction = [0, 0, 0] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const puffs = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        dx: (random(`${seed}-x-${i}`) - 0.5) * 2,
        dy: random(`${seed}-y-${i}`),
        dz: (random(`${seed}-z-${i}`) - 0.5) * 2,
        delay: random(`${seed}-d-${i}`) * 0.35,
        s: 0.6 + random(`${seed}-s-${i}`) * 0.8,
        shade: 0.85 + random(`${seed}-c-${i}`) * 0.3,
      })),
    [count, seed],
  );
  const base = new THREE.Color(color);
  return (
    <group position={position}>
      {puffs.map((p, i) => {
        const t = (frame - at) / fps - p.delay;
        if (t < 0 || t > life) return null;
        const u = t / life;
        const out = 1 - Math.exp(-t * 2.2); // fast out, then slows (drag)
        const x = p.dx * spread * out + direction[0] * out * 2 + wind[0] * t;
        const y = p.dy * spread * 0.5 * out + rise * t + direction[1] * out * 2;
        const z = p.dz * spread * out + direction[2] * out * 2 + wind[2] * t;
        const s = size * p.s * (0.3 + 1.6 * Math.sqrt(u + 0.02));
        const opacity = Math.min(1, t * 6) * Math.pow(1 - u, 1.5) * 0.38;
        const c = base.clone().multiplyScalar(p.shade);
        return (
          <mesh key={i} position={[x, y, z]} scale={s}>
            <icosahedronGeometry args={[1, 3]} />
            <meshStandardMaterial color={c} transparent opacity={opacity} roughness={1} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Sparks / debris: ballistic arcs with gravity and a floor bounce. Hot sparks glow and cool down. */
export const Debris: React.FC<{
  at: number;
  position: V3;
  count?: number;
  speed?: number;
  up?: number;
  floorY?: number;
  hot?: boolean;
  size?: number;
  color?: string;
  seed?: string;
  cone?: V3; // bias direction
}> = ({ at, position, count = 40, speed = 8, up = 6, floorY = 0, hot = true, size = 0.04, color = "#3b3631", seed = "debris", cone = [0, 0, 0] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - at) / fps;
  const parts = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => {
        const a = random(`${seed}-a-${i}`) * Math.PI * 2;
        const r = 0.3 + random(`${seed}-r-${i}`) * 0.7;
        return {
          vx: Math.cos(a) * r * speed + cone[0] * speed,
          vz: Math.sin(a) * r * speed + cone[2] * speed,
          vy: up * (0.4 + random(`${seed}-u-${i}`) * 0.9) + cone[1] * speed,
          s: size * (0.5 + random(`${seed}-s-${i}`) * 1.5),
          spin: random(`${seed}-w-${i}`) * 20,
        };
      }),
    [count, seed, speed, up, size, cone[0], cone[1], cone[2]],
  );
  if (t < 0 || t > 3) return null;
  const g = 9.8;
  const drop = Math.max(0.0001, position[1] - floorY);
  return (
    <group position={position}>
      {parts.map((p, i) => {
        const tl = (p.vy + Math.sqrt(p.vy * p.vy + 2 * g * drop)) / g; // time it lands
        let x = p.vx * t;
        let z = p.vz * t;
        let y = p.vy * t - 0.5 * g * t * t;
        if (t > tl) {
          const tt = t - tl; // small bounce, then slide to rest
          const slide = (1 - Math.exp(-tt * 3)) / 12;
          x = p.vx * tl + p.vx * slide;
          z = p.vz * tl + p.vz * slide;
          y = -drop + Math.max(0, p.vy * 0.2 * tt - 0.5 * g * tt * tt);
        }
        const heat = hot ? Math.max(0, 1 - t / 0.9) : 0;
        return (
          <mesh key={i} position={[x, y, z]} rotation={[p.spin * t, p.spin * t * 0.7, 0]} scale={p.s}>
            <boxGeometry args={[1, 1, 1]} />
            {heat > 0.05 ? (
              <meshBasicMaterial color={new THREE.Color("#ffb347").lerp(new THREE.Color("#ff3b00"), 1 - heat)} toneMapped={false} />
            ) : (
              <meshStandardMaterial color={color} roughness={0.8} />
            )}
          </mesh>
        );
      })}
    </group>
  );
};

/** Ground dust ring / shockwave: an expanding flat ring that fades. */
export const DustRing: React.FC<{ at: number; position: V3; radius?: number; color?: string; life?: number }> = ({
  at,
  position,
  radius = 6,
  color = "#b59a76",
  life = 1.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - at) / fps;
  if (t < 0 || t > life) return null;
  const u = t / life;
  const r = radius * (1 - Math.pow(1 - u, 3));
  return (
    <mesh position={[position[0], position[1] + 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[Math.max(0.01, r * 0.7), Math.max(0.02, r), 48]} />
      <meshStandardMaterial color={color} transparent opacity={(1 - u) * 0.6} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** A fast projectile with a short glowing tracer. Flies from -> to between frames at..arrive. arc = height of a lob in metres. */
export const Tracer: React.FC<{ at: number; arrive: number; from: V3; to: V3; color?: string; length?: number; arc?: number }> = ({
  at,
  arrive,
  from,
  to,
  color = "#ffcf7a",
  length = 1.5,
  arc = 0,
}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > arrive) return null;
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const total = Math.max(0.01, a.distanceTo(b));
  const u = (frame - at) / Math.max(1, arrive - at);
  const p = (k: number): THREE.Vector3 => a.clone().lerp(b, k).add(new THREE.Vector3(0, arc * 4 * k * (1 - k), 0));
  const head = p(u);
  const tail = p(Math.max(0, u - length / total));
  const mid = head.clone().add(tail).multiplyScalar(0.5);
  const len = Math.max(0.01, head.distanceTo(tail));
  const dir = head.clone().sub(tail);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.lengthSq() > 0 ? dir.normalize() : new THREE.Vector3(0, 1, 0));
  return (
    <group>
      <mesh position={mid} quaternion={q}>
        <cylinderGeometry args={[0.035, 0.012, len, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight position={head} color={color} intensity={6} distance={6} />
    </group>
  );
};

/** Damped spring for recoil, settles and overshoot. Returns displacement at time t (s) after a kick of size `amp`. */
export function springKick(t: number, amp = 1, freq = 9, damping = 6): number {
  if (t < 0) return 0;
  return amp * Math.exp(-damping * t) * Math.cos(freq * t);
}
