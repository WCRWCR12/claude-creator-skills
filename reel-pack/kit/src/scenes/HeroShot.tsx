import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { CameraRig, CamKey, EASE, fitDistance, orbitKey } from "../lib/camera";
import { GoldenHour } from "../lib/lighting";
import { Debris, DustRing, Flash, Smoke, springKick } from "../lib/fx";
import { Grain, HitFlash, LowerThird } from "../lib/overlays";

/**
 * EXAMPLE SCENE (6 s, 9:16). Copy this file to start your own.
 * Story: a lone stone monolith on a plain at golden hour. The camera cranes down and pushes in,
 * a strike hits the stone (flash, sparks, smoke, dust ring, shake, boom), the camera eases round to settle.
 *
 * How a scene is built (in this order):
 *   1. Camera keys first (the move IS the animation).
 *   2. World: ground, set, hero object, all placed in metres.
 *   3. Light: a rig from lib/lighting (warm key, cool fill, rim, haze).
 *   4. Events: frame numbers for every hit, used by FX, shake, SFX and text so they line up.
 *   5. Overlays: lower-third text, grain. Sound: <Audio> on the same event frames.
 */

const HIT = 84; // frame of the strike (2.8 s). Everything keys off this.

// CAMERA: computed from the subject's size, so it still frames correctly when you swap the subject.
// Set these for YOUR hero object: its FULL extent in metres as seen from the camera, including anything that sticks out
// (a side-on kit tank with its gun: WIDTH = TANK.overallLength, HEIGHT = TANK.height, and aim at TANK.centerX).
const SUBJECT_WIDTH = 1.4;
const SUBJECT_HEIGHT = 4.8;
const TARGET: [number, number, number] = [0, SUBJECT_HEIGHT * 0.5, 0]; // aim at the middle of the subject
const D = fitDistance(SUBJECT_WIDTH, SUBJECT_HEIGHT, 38, 0.75); // establishing distance at fov 38

// angles: 0 = camera on +Z (the subject's side if it faces +X), 90 = in front (+X), -90 = behind.
// For anything that FIRES along +X, keep the camera 40-140 degrees off the barrel axis (angles about -50..50)
// so the barrel, the flash and the smoke read side-on. Never film a firing shot straight down the barrel.
const camKeys: CamKey[] = [
  orbitKey(0, TARGET, D * 1.5, 40, SUBJECT_HEIGHT * 1.4, 44),            // high and wide: where are we?
  orbitKey(70, TARGET, D * 0.95, 20, SUBJECT_HEIGHT * 0.45, 38, EASE.smooth), // crane down + push in, low
  orbitKey(179, TARGET, D * 1.05, -15, SUBJECT_HEIGHT * 0.35, 36, EASE.out),  // ease round and settle
];

const Ground: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[400, 400, 1, 1]} />
    <meshStandardMaterial color="#8a6f4e" roughness={0.95} />
  </mesh>
);

/** Small rocks scattered with a fixed pattern (deterministic) so the ground has scale cues. */
const Rocks: React.FC = () => {
  const rocks = React.useMemo(
    () =>
      new Array(60).fill(0).map((_, i) => {
        const a = i * 2.39996; // golden angle spiral
        const r = 3 + Math.sqrt(i) * 3.2;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.15 + ((i * 37) % 10) / 25 };
      }),
    [],
  );
  return (
    <>
      {rocks.map((k, i) => (
        <mesh key={i} position={[k.x, k.s * 0.4, k.z]} scale={[k.s, k.s * 0.7, k.s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6e5a44" roughness={1} />
        </mesh>
      ))}
    </>
  );
};

const Monolith: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // the stone rocks back a touch on the hit and settles (spring), so the impact has weight
  const tilt = springKick((frame - HIT) / fps, 0.035, 10, 5);
  return (
    <group rotation={[0, 0, tilt]}>
      <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 4.8, 0.7]} />
        <meshStandardMaterial color="#5d5650" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* a scorch mark appears on the face after the hit */}
      {frame >= HIT && (
        <mesh position={[0.2, 3.1, 0.355]}>
          <circleGeometry args={[0.32, 24]} />
          <meshStandardMaterial color="#1c1814" roughness={1} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

export const HeroShot: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#c9a27e" }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <CameraRig keys={camKeys} hits={[{ f: HIT, strength: 0.16 }]} />
        <GoldenHour />
        <Ground />
        <Rocks />
        <Monolith />
        {/* strike FX, all on the same frame */}
        <Flash at={HIT} position={[0.2, 3.1, 0.6]} size={0.9} />
        <Debris at={HIT} position={[0.2, 3.1, 0.5]} count={50} speed={6} up={5} cone={[0, 0, 0.6]} />
        <Smoke at={HIT} position={[0.2, 3.1, 0.6]} count={24} spread={1.2} rise={0.9} life={3.5} direction={[0, 0.1, 0.5]} />
        <DustRing at={HIT + 2} position={[0, 0, 0]} radius={7} />
      </ThreeCanvas>

      <HitFlash at={HIT} strength={0.25} />
      <LowerThird text="Your title here" sub="lower third, never the top" from={20} to={150} />
      <Grain />

      {/* Sound on the same event frames. Generate the WAVs with: python ../tools/make_sfx.py public/sfx */}
      <Audio src={staticFile("sfx/drone.wav")} volume={0.35} />
      <Sequence from={HIT - 12}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={HIT}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.9} />
      </Sequence>
      <Sequence from={HIT + 3}>
        <Audio src={staticFile("sfx/debris.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
