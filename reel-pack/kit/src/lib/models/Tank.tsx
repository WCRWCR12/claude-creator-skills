import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * A generic WW2-style medium tank built from primitives, ready to animate.
 * Origin = centre of the hull on the ground. Front = +X. Real-ish size: ~6.6 m long, 3.3 m wide, 2.7 m tall.
 *
 * Animate it by passing numbers derived from the frame:
 *   distance   metres driven so far (spins wheels, advances the tracks)
 *   turretYaw  radians, turret rotation (0 = gun forward)
 *   gunPitch   radians, + raises the gun
 *   recoil     metres the barrel is pushed back (use springKick for fire)
 *   bodyPitch / bodyRoll  radians of suspension rock (hull + turret only, tracks stay on the ground)
 *   antennaSway radians
 * Use tankMuzzleWorld() to place the muzzle flash / smoke / tracer exactly at the barrel tip.
 */

export type TankProps = {
  position?: [number, number, number];
  yaw?: number;
  distance?: number;
  turretYaw?: number;
  gunPitch?: number;
  recoil?: number;
  bodyPitch?: number;
  bodyRoll?: number;
  antennaSway?: number;
  color?: string; // main paint
  trackColor?: string;
};

export const TANK = {
  wheelRadius: 0.36,
  turretPos: new THREE.Vector3(0.25, 2.02, 0),
  gunPivot: new THREE.Vector3(1.45, 0.08, 0),
  barrelLength: 4.4,
  /** FRAMING: overall length INCLUDING the gun (rear deck to muzzle brake, gun forward) and its centre on the X axis.
   *  Frame a side-on tank with fitDistance(TANK.overallLength, TANK.height, fov) aimed at [TANK.centerX, 1.4, 0],
   *  or the muzzle (and the flash, the whole point of a firing shot) ends up outside the frame. */
  overallLength: 9.8,
  centerX: 1.6,
  height: 2.75,
};

/** World position of the muzzle tip and the barrel direction (unit vector). */
export function tankMuzzleWorld(p: {
  position?: [number, number, number];
  yaw?: number;
  turretYaw?: number;
  gunPitch?: number;
  recoil?: number;
}): { pos: [number, number, number]; dir: [number, number, number] } {
  const { position = [0, 0, 0], yaw = 0, turretYaw = 0, gunPitch = 0, recoil = 0 } = p;
  const up = new THREE.Vector3(0, 1, 0);
  const tip = new THREE.Vector3(TANK.barrelLength + 0.35 - recoil, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), gunPitch);
  const dir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), gunPitch);
  const local = TANK.gunPivot.clone().add(tip).applyAxisAngle(up, turretYaw).add(TANK.turretPos);
  const world = local.applyAxisAngle(up, yaw).add(new THREE.Vector3(...position));
  dir.applyAxisAngle(up, turretYaw).applyAxisAngle(up, yaw);
  return { pos: [world.x, world.y, world.z], dir: [dir.x, dir.y, dir.z] };
}

const Paint: React.FC<{ color: string; shade?: number; rough?: number; metal?: number }> = ({ color, shade = 1, rough = 0.78, metal = 0.12 }) => {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(shade), [color, shade]);
  return <meshStandardMaterial color={c} roughness={rough} metalness={metal} />;
};

/** Track loop: a stadium-shaped path of links that advance with distance. */
const TrackSide: React.FC<{ z: number; distance: number; color: string }> = ({ z, distance, color }) => {
  const R = 0.47;
  const half = 2.75; // straight half-length
  const cy = 0.52;
  const P = 4 * half + 2 * Math.PI * R;
  const pitch = 0.17;
  const n = Math.floor(P / pitch);
  const at = (s: number): { x: number; y: number; a: number } => {
    s = ((s % P) + P) % P;
    if (s < 2 * half) return { x: half - s, y: cy - R, a: Math.PI }; // bottom run, front -> back
    s -= 2 * half;
    if (s < Math.PI * R) {
      const t = s / (Math.PI * R);
      const ang = -Math.PI / 2 - t * Math.PI; // rear arc
      return { x: -half + R * Math.cos(ang), y: cy + R * Math.sin(ang), a: ang - Math.PI / 2 };
    }
    s -= Math.PI * R;
    if (s < 2 * half) return { x: -half + s, y: cy + R, a: 0 }; // top run, back -> front
    s -= 2 * half;
    const t = s / (Math.PI * R);
    const ang = Math.PI / 2 - t * Math.PI; // front arc
    return { x: half + R * Math.cos(ang), y: cy + R * Math.sin(ang), a: ang - Math.PI / 2 };
  };
  const links = [];
  for (let i = 0; i < n; i++) {
    const p = at(i * pitch + distance);
    links.push(
      <mesh key={i} position={[p.x, p.y, z]} rotation={[0, 0, p.a]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.07, 0.62]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.5} />
      </mesh>,
    );
  }
  return <>{links}</>;
};

const Wheel: React.FC<{ x: number; y: number; z: number; r: number; spin: number; color: string }> = ({ x, y, z, r, spin, color }) => (
  <group position={[x, y, z]} rotation={[0, 0, -spin]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[r, r, 0.3, 24]} />
      <Paint color={color} shade={0.8} />
    </mesh>
    {/* hub + a spoke bar so you can SEE it turning */}
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, Math.sign(z) * 0.16]}>
      <cylinderGeometry args={[r * 0.35, r * 0.35, 0.06, 12]} />
      <Paint color={color} shade={0.6} metal={0.4} />
    </mesh>
    <mesh position={[0, 0, Math.sign(z) * 0.2]}>
      <boxGeometry args={[r * 1.6, r * 0.18, 0.04]} />
      <Paint color={color} shade={0.55} />
    </mesh>
  </group>
);

export const Tank: React.FC<TankProps> = ({
  position = [0, 0, 0],
  yaw = 0,
  distance = 0,
  turretYaw = 0,
  gunPitch = 0.03,
  recoil = 0,
  bodyPitch = 0,
  bodyRoll = 0,
  antennaSway = 0,
  color = "#5b5a3a",
  trackColor = "#3a3633",
}) => {
  const spin = distance / TANK.wheelRadius;
  const wheelsX = [-2.2, -1.32, -0.44, 0.44, 1.32, 2.2];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* running gear: stays on the ground */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <TrackSide z={side * 1.35} distance={distance} color={trackColor} />
          {wheelsX.map((x) => (
            <Wheel key={x} x={x} y={0.43} z={side * 1.35} r={TANK.wheelRadius} spin={spin} color={color} />
          ))}
          <Wheel x={2.85} y={0.72} z={side * 1.35} r={0.32} spin={spin * 1.2} color={color} />
          <Wheel x={-2.85} y={0.68} z={side * 1.35} r={0.3} spin={spin * 1.25} color={color} />
          {/* return rollers */}
          {[-1.4, 0, 1.4].map((x) => (
            <Wheel key={`r${x}`} x={x} y={0.93} z={side * 1.35} r={0.09} spin={spin * 4} color={color} />
          ))}
        </group>
      ))}

      {/* sprung body: hull + turret rock on the suspension */}
      <group position={[0, 0, 0]} rotation={[bodyRoll, 0, bodyPitch]}>
        {/* lower hull between the tracks */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.1, 0.8, 2.1]} />
          <Paint color={color} shade={0.82} />
        </mesh>
        {/* upper hull with fenders over the tracks */}
        <mesh position={[-0.15, 1.58, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.7, 0.42, 3.3]} />
          <Paint color={color} />
        </mesh>
        {/* sloped glacis plate */}
        <mesh position={[2.95, 1.33, 0]} rotation={[0, 0, -0.95]} castShadow>
          <boxGeometry args={[1.05, 0.14, 3.0]} />
          <Paint color={color} shade={1.04} />
        </mesh>
        {/* lower nose */}
        <mesh position={[3.12, 0.85, 0]} rotation={[0, 0, 0.6]} castShadow>
          <boxGeometry args={[0.6, 0.12, 2.1]} />
          <Paint color={color} shade={0.85} />
        </mesh>
        {/* driver's visor + hull MG */}
        <mesh position={[2.72, 1.66, -0.75]} rotation={[0, 0, -0.95]}>
          <boxGeometry args={[0.32, 0.06, 0.5]} />
          <Paint color="#1d1d1a" />
        </mesh>
        <mesh position={[2.85, 1.55, 0.75]} rotation={[0, 0, Math.PI / 2 - 0.15]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <Paint color="#222" metal={0.6} />
        </mesh>
        {/* headlights */}
        {[-1.2, 1.2].map((z) => (
          <mesh key={z} position={[2.75, 1.86, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.14, 12]} />
            <Paint color="#c9c3a6" rough={0.3} />
          </mesh>
        ))}
        {/* engine deck: grilles, exhausts, tool box */}
        {[-1.6, -2.3].map((x) => (
          <mesh key={x} position={[x, 1.8, 0]}>
            <boxGeometry args={[0.5, 0.04, 2.0]} />
            <Paint color={color} shade={0.6} />
          </mesh>
        ))}
        {[-0.7, 0.7].map((z) => (
          <mesh key={z} position={[-3.05, 1.45, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.11, 0.13, 0.35, 12]} />
            <Paint color="#3b2f27" rough={0.9} metal={0.4} />
          </mesh>
        ))}
        <mesh position={[0.6, 1.86, 1.48]} castShadow>
          <boxGeometry args={[1.6, 0.14, 0.24]} />
          <Paint color={color} shade={0.75} />
        </mesh>
        {/* spare track links on the glacis */}
        {[-0.9, -0.55, 0.55, 0.9].map((z) => (
          <mesh key={z} position={[2.86, 1.43, z]} rotation={[0, 0, -0.95]}>
            <boxGeometry args={[0.45, 0.06, 0.3]} />
            <meshStandardMaterial color={trackColor} roughness={0.7} metalness={0.5} />
          </mesh>
        ))}

        {/* turret */}
        <group position={TANK.turretPos.toArray() as [number, number, number]} rotation={[0, turretYaw, 0]}>
          <mesh position={[0, 0.02, 0]} scale={[1.2, 1, 1]} castShadow receiveShadow>
            <cylinderGeometry args={[1.05, 1.3, 0.78, 10]} />
            <Paint color={color} shade={1.02} />
          </mesh>
          {/* rear bustle / stowage box */}
          <mesh position={[-1.5, 0.0, 0]} castShadow>
            <boxGeometry args={[0.7, 0.55, 1.7]} />
            <Paint color={color} shade={0.9} />
          </mesh>
          {/* commander's cupola + hatch */}
          <mesh position={[-0.45, 0.52, -0.5]} castShadow>
            <cylinderGeometry args={[0.36, 0.4, 0.28, 16]} />
            <Paint color={color} shade={0.95} />
          </mesh>
          <mesh position={[-0.45, 0.68, -0.5]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <Paint color={color} shade={0.8} />
          </mesh>
          {/* loader's hatch */}
          <mesh position={[-0.3, 0.42, 0.55]}>
            <boxGeometry args={[0.55, 0.04, 0.45]} />
            <Paint color={color} shade={0.85} />
          </mesh>
          {/* antenna with sway */}
          <group position={[-1.0, 0.4, 0.75]} rotation={[antennaSway, 0, antennaSway * 0.6]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.012, 0.02, 2.2, 6]} />
              <Paint color="#222" metal={0.6} />
            </mesh>
          </group>
          {/* mantlet */}
          <mesh position={[1.42, 0.06, 0]} castShadow>
            <boxGeometry args={[0.42, 0.62, 1.05]} />
            <Paint color={color} shade={0.92} />
          </mesh>
          {/* gun: pivots at the mantlet, barrel slides back on recoil */}
          <group position={TANK.gunPivot.toArray() as [number, number, number]} rotation={[0, 0, gunPitch]}>
            <group position={[-recoil, 0, 0]}>
              <mesh position={[TANK.barrelLength / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.075, 0.1, TANK.barrelLength, 16]} />
                <Paint color={color} shade={0.85} metal={0.3} />
              </mesh>
              {/* bore evacuator */}
              <mesh position={[TANK.barrelLength * 0.62, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.13, 0.13, 0.5, 16]} />
                <Paint color={color} shade={0.8} metal={0.3} />
              </mesh>
              {/* muzzle brake */}
              <mesh position={[TANK.barrelLength + 0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
                <Paint color="#3a3a33" metal={0.5} />
              </mesh>
            </group>
          </group>
          {/* coaxial MG port */}
          <mesh position={[1.66, 0.05, 0.32]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <Paint color="#1d1d1a" />
          </mesh>
        </group>
      </group>
    </group>
  );
};
