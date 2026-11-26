import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import * as THREE from "three";
import {
  MythStage, MythCaptions, loadMan, cam, V, shots, shotAt, seg, smooth, easeInOut, lerp, blinkAt, blinkPulse,
  makeDust, setDust, makeTable, bounceY, fallTime,
  type Cam, type Chunk, type Studio,
} from "../lib/myth";

/**
 * WORKED EXAMPLE of the myth-explainer format (skill: myth-explainer). 9.6 s, 11 shots, 27 words.
 * "If you rolled a ball off a table and dropped another beside it, most people assume the dropped one lands first.
 *  But they hit the floor together."
 * Copy this file to start your own: keep the structure (shot list -> captions -> one function per shot), change the rest.
 *
 * The physics is computed, not eyeballed: sideways speed does not change how fast a thing falls, so both balls take
 * fallTime(0.88 m) = 0.42 s. Every shot reads the SAME ball clock `b` (seconds since the red ball left the edge), slowed by
 * a different amount per shot, so the man's fingers, both balls and the dust always agree.
 */

// ---- 1. the shot list: one picture per clause, about one a second, nothing under 0.6 s (shots() throws if one is) ----
const SHOTS = shots([
  ["PUSH", 0.95], ["TOP", 0.63], ["EDGE", 0.95], ["HAND", 0.94], ["LEVEL", 0.64], ["MAP", 0.94],
  ["GUESS", 0.95], ["GUESS_LAND", 0.63], ["HIM", 0.63], ["AIR", 0.95], ["LAND", 1.39],
]);
export const MYTH_TWO_BALLS_SECONDS = SHOTS[SHOTS.length - 1].t1;

// ---- 2. the captions: 1-3 words, each starting on its spoken word. Every shot starts on a chunk. ----
const CAPTIONS: Chunk[] = [
  [0.0, "IF YOU ROLLED"], [0.95, "A BALL"], [1.58, "OFF A TABLE"], [2.53, "AND DROPPED"], [3.16, "ANOTHER"], [3.47, "BESIDE IT"],
  [4.11, "MOST PEOPLE"], [4.74, "ASSUME"], [5.05, "THE DROPPED ONE"], [6.0, "LANDS FIRST"],
  [6.63, "BUT THEY"], [7.26, "HIT THE FLOOR"], [8.21, "TOGETHER"],
];

// ---- 3. the set, in metres ----
const TOP = 0.88, R = 0.065, G = 9.81, ROLL = 1.0;        // table height, ball radius, gravity, roll speed (m/s)
const EDGE = V(0.8, TOP + R, 0.15);                          // where the red ball leaves the table
const BLUE0 = V(0.86, TOP + R, -0.25);                       // where the blue ball is let go, beside the edge
const TF = fallTime(TOP);                                    // 0.42 s: the same for both balls
const MIDZ = (EDGE.z + BLUE0.z) / 2;
const LAND_T = SHOTS[10].t0 + (TF - 0.36) / 0.2;             // film time of the landing in the last shot (for the sound)

async function setup(studio: Studio) {
  const { scene } = studio;
  const table = makeTable(scene, 1.6, 0.8, TOP);
  const ballMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.32 });
  const red = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 24), ballMat(0xd8342a));
  const blue = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 24), ballMat(0x1f5fd8));
  red.castShadow = blue.castShadow = true;
  scene.add(red, blue);
  const dust = makeDust(scene, 20);
  const man = await loadMan(studio, { base: staticFile("myth/") });

  // Both balls from one clock. b < 0: red still rolling along the top, blue still held. b = 0: red leaves, blue is let go.
  // wrong = the picture in most people's heads (the rolled ball "hangs" in the air): shown for real, then denied.
  function balls(b: number, wrong = false) {
    const x = EDGE.x + ROLL * b * (b < TF || wrong ? 1 : 0.8 + 0.2 * Math.exp(-(b - TF)));
    const yRed = b < 0 ? EDGE.y : wrong ? Math.max(R, EDGE.y - 0.5 * G * 0.22 * b * b) : bounceY(b, EDGE.y, R);
    red.position.set(x, yRed, EDGE.z);
    red.rotation.set(0, 0, -(x - EDGE.x) / R);
    blue.position.set(BLUE0.x, bounceY(b, BLUE0.y, R), BLUE0.z);
    const age = (b - TF) * 3;
    setDust(dust, 0, 10, V(BLUE0.x, 0, BLUE0.z), age, 0.7);
    setDust(dust, 10, 10, V(x, 0, EDGE.z), wrong ? -1 : age, 0.7);
  }

  // The man at the end of the table, holding the blue ball out from above. Body from a library clip (Idle_Loop) that
  // breathes and blinks; the right hand is put on the ball with IK; the fingers open thumb-and-index first at b = 0.
  function holdBall(t: number, b: number, lookDown = 0, arm = 1) {
    man.root.position.set(BLUE0.x + 0.2, 0, BLUE0.z - 0.2);
    man.root.rotation.set(0, 0, 0);
    man.play("Idle_Loop", t);
    man.relax(1);
    man.breathe(t, 0.8);
    man.look([0.55 * lookDown, 0], [0.6 * smooth(seg(lookDown, 0.2, 1)), 0]);            // neck leads, head follows
    const lift = 0.05 * smooth(seg(b, 0.02, 0.25));                                       // the hand eases up and away after letting go
    if (arm) man.reach("r", V(BLUE0.x, BLUE0.y + R * 0.55 + lift, BLUE0.z), { hand: { fingers: V(0.1, -0.35, 1), palm: V(0, -1, 0.15) } });
    if (arm) { man.openHand("r"); man.curl("r", 0.32, 0.25); man.release("r", b, 0.05, 2); }
    man.setBlink(blinkAt(t));
  }

  // ---- 4. one function per shot. u = seconds into the shot, D = its length, t = film time. Each returns its camera. ----
  const SH: Record<string, (u: number, D: number, t: number) => Cam> = {
    // side medium: he is already reaching; the push lands at 0.34 s (the act happens inside the first 0.6 s)
    PUSH(u, D) {
      const push = 0.34, b0 = 1.45;
      man.root.rotation.set(0, Math.PI / 2, 0);
      man.root.position.set(EDGE.x - b0 * ROLL - 0.03 - 0.41 - R, 0, EDGE.z + 0.19);
      man.play("PickUp_Table", 0.21 + (u - push), false);
      man.breathe(u + 11, 0.6);
      man.setBlink(blinkPulse(u, 0.62));
      blue.visible = false;
      balls(u < push ? -b0 : -b0 + (u - push) * ROLL);
      return cam(u, D, V(-0.45, 1.55, 3.0), V(-0.52, 1.53, 2.88), V(-0.75, 0.98, 0.15), V(-0.7, 0.98, 0.15), 36);
    },
    // straight down: the table top fills the frame (the picture turns warm wood: the eye gets a reset)
    TOP(u, D) {
      man.root.visible = false; blue.visible = false;
      balls(-0.8 + u * 0.5);
      const k = u / D;
      return { fov: 30, lens: 0.002, eye: V(EDGE.x - 0.42 + 0.05 * k, lerp(2.15, 1.95, k), EDGE.z - 0.05), look: V(EDGE.x - 0.42 + 0.05 * k, 0.75, EDGE.z - 0.05), up: V(1, 0, 0) };
    },
    // close at table height: the ball reaches the edge and leaves it
    EDGE(u, D, t) {
      holdBall(t, -1);
      balls(-0.42 + u * 0.45);
      return cam(u, D, V(EDGE.x + 0.2, 1.0, EDGE.z + 0.8), V(EDGE.x + 0.24, 0.98, EDGE.z + 0.72), V(EDGE.x - 0.08, 0.9, EDGE.z), V(EDGE.x - 0.02, 0.89, EDGE.z), 30, 0.006);
    },
    // close on the hand: the fingers part and the blue ball is free at the instant the red one leaves the edge
    HAND(u, D, t) {
      const b = -0.1 + u * 0.14;
      holdBall(t, b);
      balls(b);
      return cam(u, D, V(BLUE0.x + 0.75, 1.1, BLUE0.z + 0.85), V(BLUE0.x + 0.68, 1.07, BLUE0.z + 0.8), V(BLUE0.x, 0.97, BLUE0.z + 0.02), V(BLUE0.x, 0.95, BLUE0.z + 0.02), 30, 0.005);
    },
    // side on: both balls just free, dead level
    LEVEL(u, D, t) {
      const b = 0.035 + u * 0.1;
      holdBall(t, b);
      balls(b);
      return cam(u, D, V(3.5, 0.98, MIDZ - 0.12), V(3.38, 0.97, MIDZ - 0.12), V(0.8, 0.9, MIDZ - 0.12), V(0.8, 0.88, MIDZ - 0.12), 30, 0.004);
    },
    // THE MAP: straight down on the whole set-up, real 3D, the man small. The one shot that shows where everything is.
    MAP(u, D, t) {
      const b = -0.62 + u * 0.6;
      holdBall(t, b);
      balls(b);
      const k = u / D;
      return { fov: 30, lens: 0, eye: V(0.2, lerp(6.9, 6.3, k), -0.2), look: V(0.2, 0, -0.2), up: V(Math.cos(0.08 * k), 0, Math.sin(0.08 * k)) };
    },
    // the wrong guess, acted out for real: the dropped ball falls, the rolled one sails out and hangs
    GUESS(u, D, t) {
      const b = 0.02 + u * 0.3;
      holdBall(t, b, easeInOut(seg(u, 0.1, 0.6)));
      balls(b, true);
      return cam(u, D, V(3.0, 0.55, 1.95), V(2.9, 0.52, 1.85), V(1.0, 0.55, -0.05), V(1.02, 0.5, -0.05), 30, 0.003);
    },
    GUESS_LAND(u, D, t) {
      const b = 0.33 + u * 0.3;
      holdBall(t, b, 1);
      balls(b, true);
      return cam(u, D, V(3.25, 0.12, 0.5), V(3.15, 0.13, 0.46), V(1.05, 0.34, -0.05), V(1.06, 0.33, -0.05), 34, 0.006);
    },
    // the denial: back on him. He looks up from the floor; a blink placed on purpose
    HIM(u, D, t) {
      red.visible = blue.visible = false;
      holdBall(t, 1, 1 - easeInOut(seg(u, 0.05, 0.5)), 0);
      man.setBlink(blinkPulse(u, 0.3));
      return cam(u, D, V(0.6, 1.62, 2.25), V(0.66, 1.61, 2.1), V(1.06, 1.5, -0.45), V(1.06, 1.51, -0.45), 30, 0.004);
    },
    // macro, side on: what really happens. Both in the air, level, the red one still moving sideways; camera drifts round
    AIR(u, D) {
      man.root.visible = false;
      balls(0.11 + u * 0.12);
      const y = (red.position.y + blue.position.y) / 2, a = lerp(-0.2, 0.05, u / D), c = V(EDGE.x + 0.14, y, MIDZ);
      return { fov: 24, lens: 0.012, eye: c.clone().add(V(Math.cos(a) * 2.4, 0.03, Math.sin(a) * 2.4)), look: c };
    },
    // macro at the floor: both touch down on the same frame, two puffs, small bounces
    LAND(u, D) {
      man.root.visible = false;
      balls(0.36 + u * 0.2);
      return cam(u, D, V(EDGE.x + 2.45, 0.075, EDGE.z + 0.5), V(EDGE.x + 2.35, 0.08, EDGE.z + 0.45), V(EDGE.x + 0.3, 0.1, MIDZ), V(EDGE.x + 0.32, 0.1, MIDZ), 26, 0.008);
    },
  };

  // ---- 5. the frame function: reset, find the shot, let it set the scene ----
  return (t: number) => {
    man.root.visible = table.visible = red.visible = blue.visible = true;
    man.setBlink(0);
    const s = shotAt(SHOTS, t);
    return SH[s.id](t - s.t0, s.t1 - s.t0, t);
  };
}

export const MythTwoBalls: React.FC<{ samples?: number }> = ({ samples = 6 }) => {
  return (
    <AbsoluteFill>
      <MythStage setup={setup} shots={SHOTS} samples={samples} />
      <MythCaptions chunks={CAPTIONS} />
      {/* sound: a quiet held chord with no beat and no tune (tools/make_pad.py), and a knock on the frame both balls land */}
      <Audio src={staticFile("myth/pad-example.wav")} volume={0.5} />
      <Sequence from={Math.round(LAND_T * 30)}><Audio src={staticFile("sfx/knock.wav")} volume={0.9} /></Sequence>
      <Sequence from={Math.round((SHOTS[7].t0 + (TF - 0.33) / 0.3) * 30)}><Audio src={staticFile("sfx/knock.wav")} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
