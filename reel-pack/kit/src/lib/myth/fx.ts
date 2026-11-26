// Small effects for the studio: a thin bright trail behind a flying thing, a dust puff where something lands,
// a soft floor mark. All are pure functions of the numbers you pass in (no state between frames).
import * as THREE from "three";
import { hash } from "./math";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** A trail mesh. rgb above 1 glows (additive). Orange [3.2, 1.25, 0.32], cool white [1.4, 1.6, 1.9]. */
export function makeTrail(scene: THREE.Scene, rgb: [number, number, number] = [3.2, 1.25, 0.32]) {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  m.userData.rgb = rgb;
  m.frustumCulled = false;
  m.visible = false;
  scene.add(m);
  return m;
}
/** Draw the trail through `pts` (oldest first, newest last). It fades toward the oldest point. rad = thickness in metres. */
export function setTrail(m: THREE.Mesh, pts: THREE.Vector3[], rad = 0.004, power = 1.4, gain = 1) {
  m.geometry.dispose();
  if (pts.length < 2) { m.visible = false; return; }
  m.visible = true;
  const TS = Math.max(8, pts.length * 2), RS = 6;
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), TS, rad, RS, false);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  const [r, gg, b] = m.userData.rgb;
  for (let i = 0; i <= TS; i++) {
    const f = Math.pow(i / TS, power) * gain;
    for (let j = 0; j <= RS; j++) { const k = (i * (RS + 1) + j) * 3; col[k] = r * f; col[k + 1] = gg * f; col[k + 2] = b * f; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  m.geometry = g;
}
/** Trail of a moving thing from its own path: pos(s) gives the position at time s; draws the last `len` seconds up to `s`. */
export function trailOf(m: THREE.Mesh, pos: (s: number) => THREE.Vector3, s: number, len = 0.08, rad = 0.004) {
  if (s <= 0.002) { m.visible = false; return; }
  const a = Math.max(0, s - len), pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) pts.push(pos(a + ((s - a) * i) / 20));
  setTrail(m, pts, rad);
}

/** A pool of soft dust blobs. One pool can serve several puffs: give each puff its own slice (i0, n). */
export function makeDust(scene: THREE.Scene, count = 24, color = 0xdbe8f5) {
  return Array.from({ length: count }, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.5, depthWrite: false }));
    m.castShadow = false;
    m.visible = false;
    scene.add(m);
    return m;
  });
}
/** A puff at `at`, `age` seconds after the landing (age <= 0 hides it). size 1 = a ball landing; 0.4 = a coin. */
export function setDust(dust: THREE.Mesh[], i0: number, n: number, at: THREE.Vector3, age: number, size = 1) {
  for (let i = i0; i < Math.min(dust.length, i0 + n); i++) {
    const m = dust[i];
    if (age <= 0 || age > 1.6) { m.visible = false; continue; }
    m.visible = true;
    const ang = hash(i * 2.3) * Math.PI * 2, sp = (0.15 + hash(i * 1.7) * 0.25) * size, k = 1 - Math.exp(-age * 5);
    m.position.set(at.x + Math.cos(ang) * sp * k, 0.01 + (0.04 + hash(i) * 0.06) * size * k, at.z + Math.sin(ang) * sp * k);
    m.scale.setScalar((0.012 + 0.05 * k) * size);
    (m.material as THREE.MeshStandardMaterial).opacity = 0.42 * (1 - age / 1.6);
  }
}

/** Fall from height y0 (centre of a ball of radius r) under gravity, then a few dying bounces. b = seconds since let go. */
export function bounceY(b: number, y0: number, r: number, g = 9.81, restitution = 0.45) {
  const tf = Math.sqrt((2 * (y0 - r)) / g);
  if (b < 0) return y0;
  if (b < tf) return y0 - 0.5 * g * b * b;
  let v = g * tf * restitution, tt = b - tf;
  for (let k = 0; k < 4; k++) { const T = (2 * v) / g; if (tt < T) return r + v * tt - 0.5 * g * tt * tt; tt -= T; v *= restitution; }
  return r;
}
/** Seconds to fall h metres from rest. Compute timings from this, never by eye. */
export const fallTime = (h: number, g = 9.81) => Math.sqrt((2 * h) / g);

/** A plain four-legged table, top surface at `height`. Returned group sits on the floor at its own origin. */
export function makeTable(scene: THREE.Scene, w = 1.6, d = 0.8, height = 0.88, color = 0xa8743f) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.52 });
  const bx = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); };
  bx(w, 0.05, d, 0, height - 0.025, 0);
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) bx(0.05, height - 0.05, 0.05, x * (w / 2 - 0.06), (height - 0.05) / 2, z * (d / 2 - 0.06));
  scene.add(g);
  return g;
}
export { V };
