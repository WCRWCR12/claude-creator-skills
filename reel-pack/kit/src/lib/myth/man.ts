// The man: a rigged CC0 human (Quaternius "Universal Base Characters", Superhero Male) driven by CC0 library clips
// (Quaternius "Universal Animation Library", Standard: 45 clips) that are retargeted onto him in code, with procedural
// life on top (breathing, sway, blinks, recoil, two-bone IK for hands). His clothes, hair and brows are shader work on the
// base mesh. Licences: see THIRD-PARTY-NOTICES.md. Everything here is a pure function of the time you pass in.
//
// The rule this file exists for: body motion comes from a real source (a library clip, physics) or is a held pose that
// breathes. Never hand-key a whole body. Use IK only to put a hand exactly on a prop.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clamp, drift, kick, lerp, seg, smooth } from "./math";
import type { Studio } from "./studio";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UPW = V(0, 1, 0);
export type Side = "l" | "r";
export type Pose = { q: Record<string, THREE.Quaternion>; p: THREE.Vector3 };
export type ManOptions = {
  /** Folder (URL) holding the character files. In Remotion: staticFile("myth/"). */
  base: string;
  /** Upper-body width (the base mesh is a superhero; 0.88 is a normal build). */
  upperScale?: number;
  headScale?: number;
  shirt?: [number, number, number];
  trousers?: [number, number, number];
  shoes?: [number, number, number];
  hair?: number;
};
export type Man = Awaited<ReturnType<typeof loadMan>>;

/** Every clip in the library (45). Loop clips end in _Loop; the others play once. */
export const CLIPS = ["A_TPose", "Crouch_Fwd_Loop", "Crouch_Idle_Loop", "Dance_Loop", "Death01", "Driving_Loop", "Fixing_Kneeling", "Hit_Chest", "Hit_Head", "Idle_Loop", "Idle_Talking_Loop", "Idle_Torch_Loop", "Interact", "Jog_Fwd_Loop", "Jump_Land", "Jump_Loop", "Jump_Start", "PickUp_Table", "Pistol_Aim_Down", "Pistol_Aim_Neutral", "Pistol_Aim_Up", "Pistol_Idle_Loop", "Pistol_Reload", "Pistol_Shoot", "Punch_Cross", "Punch_Jab", "Push_Loop", "Roll", "Roll_RM", "Sitting_Enter", "Sitting_Exit", "Sitting_Idle_Loop", "Sitting_Talking_Loop", "Spell_Simple_Enter", "Spell_Simple_Exit", "Spell_Simple_Idle_Loop", "Spell_Simple_Shoot", "Sprint_Loop", "Swim_Fwd_Loop", "Swim_Idle_Loop", "Sword_Attack", "Sword_Attack_RM", "Sword_Idle", "Walk_Formal_Loop", "Walk_Loop"] as const;
export type Clip = (typeof CLIPS)[number];

export async function loadMan(studio: Studio, opts: ManOptions) {
  const A = opts.base.endsWith("/") ? opts.base : opts.base + "/";
  const loader = new GLTFLoader();
  const [charG, ualG] = await Promise.all([loader.loadAsync(A + "Superhero_Male_FullBody.gltf"), loader.loadAsync(A + "UAL1_Standard.glb")]);
  /** Move and turn this to place him. He faces +z at rotation 0; feet on y = 0. */
  const root = new THREE.Group();
  studio.scene.add(root);
  root.add(charG.scene);

  // ---------- bones + retarget (the library's mannequin has a different rest pose, so world-space rotation deltas are carried over) ----------
  const TB: Record<string, THREE.Bone> = {};
  let bodyMesh!: THREE.SkinnedMesh, browMesh!: THREE.SkinnedMesh, eyeMesh!: THREE.SkinnedMesh;
  charG.scene.traverse((o: any) => {
    if (o.isBone) TB[o.name] = o;
    o.frustumCulled = false;
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    if (o.isSkinnedMesh) { if (o.name === "SuperHero_Male") bodyMesh = o; else if (o.name === "Eyebrows") browMesh = o; else eyeMesh = o; }
  });
  const src = ualG.scene;
  const SB: Record<string, THREE.Bone> = {};
  src.traverse((o: any) => { if (o.isBone) SB[o.name] = o; });
  src.updateMatrixWorld(true);
  charG.scene.updateMatrixWorld(true);
  const NAMES = Object.keys(TB).filter((n) => SB[n]);
  const ORDER: string[] = [];
  (function walk(b: any) { if (b.isBone && SB[b.name]) ORDER.push(b.name); b.children.forEach(walk); })(TB.root);
  const restS: Record<string, THREE.Quaternion> = {}, restT: Record<string, THREE.Quaternion> = {}, restTL: Record<string, THREE.Quaternion> = {};
  const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion();
  for (const n of NAMES) { restS[n] = SB[n].getWorldQuaternion(new THREE.Quaternion()); restT[n] = TB[n].getWorldQuaternion(new THREE.Quaternion()); restTL[n] = TB[n].quaternion.clone(); }
  const UP = opts.upperScale ?? 0.88;
  TB.spine_03.scale.setScalar(UP);
  TB.Head.scale.setScalar((opts.headScale ?? 1.1) / UP);
  TB.hand_l.scale.setScalar(1.04 / UP);
  TB.hand_r.scale.setScalar(1.04 / UP);
  const HIP_K = TB.pelvis.position.length() / SB.pelvis.position.length();
  const restPelvisT = TB.pelvis.position.clone(), restPelvisS = SB.pelvis.position.clone();
  const mixer = new THREE.AnimationMixer(src);
  const ACT: Record<string, THREE.AnimationAction> = {};
  /** Length of each clip in seconds. */
  const dur: Record<string, number> = {};
  for (const c of ualG.animations) { const a = mixer.clipAction(c); a.play(); a.setEffectiveWeight(0); ACT[c.name] = a; dur[c.name] = c.duration; }
  let curClip: string | null = null;
  const modelQ: Record<string, THREE.Quaternion> = {};
  const newPose = (): Pose => ({ q: {}, p: V() });

  /** Read a library clip at `time` into a pose (does not move him yet). loop=false holds the last frame. */
  function sample(name: Clip, time: number, pose: Pose, loop = true): Pose {
    if (!ACT[name]) throw new Error(`no clip "${name}". Clips: ${Object.keys(ACT).join(", ")}`);
    if (curClip !== name) { if (curClip) ACT[curClip].setEffectiveWeight(0); ACT[name].setEffectiveWeight(1); curClip = name; }
    const d = dur[name];
    ACT[name].time = loop ? ((time % d) + d) % d : clamp(time, 0, d - 1e-4);
    mixer.update(0);
    src.updateMatrixWorld(true);
    for (const n of ORDER) {
      SB[n].getWorldQuaternion(tmpQ);
      const m = (modelQ[n] ||= new THREE.Quaternion());
      m.copy(tmpQ).multiply(tmpQ2.copy(restS[n]).invert()).multiply(restT[n]);
      const par = TB[n].parent as any;
      const q = (pose.q[n] ||= new THREE.Quaternion());
      if (par && par.isBone && modelQ[par.name]) q.copy(modelQ[par.name]).invert().multiply(m); else q.copy(m);
    }
    pose.p.copy(SB.pelvis.position).sub(restPelvisS).multiplyScalar(HIP_K).add(restPelvisT);
    return pose;
  }
  /** Mix two poses (w 0..1). Use it to ease from one clip into the next over 0.1-0.5 s. */
  function blend(a: Pose, b: Pose, w: number, out: Pose): Pose {
    for (const n of ORDER) (out.q[n] ||= new THREE.Quaternion()).copy(a.q[n]).slerp(b.q[n], w);
    out.p.copy(a.p).lerp(b.p, w);
    return out;
  }
  /** Put a pose on him. Always call this (or play) first each frame, then add life (breathe, look, reach...). */
  function apply(pose: Pose) { for (const n of ORDER) TB[n].quaternion.copy(pose.q[n]); TB.pelvis.position.copy(pose.p); }
  /** Copy his current bone state into a pose (to blend out of whatever he is doing now). */
  function capture(out: Pose): Pose { for (const n of ORDER) (out.q[n] ||= new THREE.Quaternion()).copy(TB[n].quaternion); out.p.copy(TB.pelvis.position); return out; }
  const P_PLAY = newPose();
  /** sample + apply in one call: the usual way to start a frame. */
  function play(name: Clip, time: number, loop = true) { apply(sample(name, time, P_PLAY, loop)); }

  // ---------- small bone tools ----------
  const EX = new THREE.Euler(), QX = new THREE.Quaternion();
  const _pw = new THREE.Quaternion(), _bw = new THREE.Quaternion(), _mq = new THREE.Quaternion(), _r = new THREE.Quaternion(), _v3 = V(), _v4 = V();
  /** Add a rotation in the bone's own space (radians). For spine, neck, clavicles. */
  const addRot = (n: string, x: number, y: number, z: number) => { TB[n].quaternion.multiply(QX.setFromEuler(EX.set(x, y, z))); };
  /** World position of a bone. */
  const wpos = (n: string, out = V()) => { root.updateMatrixWorld(true); return TB[n].getWorldPosition(out); };
  /** Turn a bone about a WORLD axis. */
  function worldRot(n: string, axis: THREE.Vector3, ang: number) {
    root.updateMatrixWorld(true);
    (TB[n].parent as THREE.Object3D).getWorldQuaternion(_pw); TB[n].getWorldQuaternion(_bw);
    _r.setFromAxisAngle(axis, ang);
    TB[n].quaternion.copy(_pw.invert()).multiply(_r).multiply(_bw);
  }
  /** Turn a bone about an axis given in HIS space (so it works whichever way he faces). */
  function manRot(n: string, ax: THREE.Vector3, ang: number) {
    root.updateMatrixWorld(true);
    root.getWorldQuaternion(_mq); (TB[n].parent as THREE.Object3D).getWorldQuaternion(_pw); TB[n].getWorldQuaternion(_bw);
    _r.setFromAxisAngle(ax, ang); _r.premultiply(_mq).multiply(_mq.clone().invert());
    TB[n].quaternion.copy(_pw.invert()).multiply(_r).multiply(_bw);
  }
  function setWorldQuat(n: string, qw: THREE.Quaternion) { root.updateMatrixWorld(true); (TB[n].parent as THREE.Object3D).getWorldQuaternion(_pw); TB[n].quaternion.copy(_pw.invert()).multiply(qw); }
  /** Swing bone `n` so that its child points along world direction `dir`. */
  function aimBone(n: string, child: string, dir: THREE.Vector3) {
    root.updateMatrixWorld(true);
    TB[n].getWorldPosition(_v3); TB[child].getWorldPosition(_v4);
    _v4.sub(_v3).normalize();
    _r.setFromUnitVectors(_v4, dir.clone().normalize());
    (TB[n].parent as THREE.Object3D).getWorldQuaternion(_pw); TB[n].getWorldQuaternion(_bw);
    TB[n].quaternion.copy(_pw.invert()).multiply(_r).multiply(_bw);
  }
  /** Two-bone IK: upper -> lower -> end reaches `target`; the middle joint bends toward `pole` (a world direction). */
  function ik2(a: string, b: string, c: string, target: THREE.Vector3, pole: THREE.Vector3) {
    const S = wpos(a), E = wpos(b), Hn = wpos(c);
    const L1 = S.distanceTo(E), L2 = E.distanceTo(Hn);
    const d = target.clone().sub(S);
    const dl = clamp(d.length(), 0.05, L1 + L2 - 0.002);
    const dir = d.normalize();
    const a1 = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - a1 * a1));
    const pp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
    const elbow = S.clone().addScaledVector(dir, a1).addScaledVector(pp, h);
    aimBone(a, b, elbow.clone().sub(S));
    aimBone(b, c, S.clone().addScaledVector(dir, dl).sub(elbow));
  }
  /** His forward and right in the world (after you have placed him). */
  function basis() { root.updateMatrixWorld(true); const fwd = V(0, 0, 1).applyQuaternion(root.quaternion).normalize(); return { fwd, right: V().crossVectors(fwd, UPW).normalize() }; }

  // ---------- hands ----------
  const FINGERS = Object.keys(TB).filter((n) => /^(index|middle|ring|pinky|thumb)_0[123]_/.test(n));
  const fingersOf = (sd: Side) => FINGERS.filter((n) => n.endsWith("_" + sd));
  // hand frame (finger axis, side, palm normal) in each hand bone's own space, so a hand can be given an exact world orientation
  function handFrame(sd: Side) {
    const f = TB["middle_01_" + sd].position.clone().normalize();
    const sm = TB["index_01_" + sd].position.clone().sub(TB["pinky_01_" + sd].position).normalize();
    const n = V().crossVectors(f, sm).normalize();
    return { m: new THREE.Matrix4().makeBasis(f, V().crossVectors(n, f), n), n };
  }
  const HF = { l: handFrame("l"), r: handFrame("r") };
  // which way is "out of the palm": anatomy fixes it. With n = fingers x (pinky -> index), the palm is +n on a left hand and -n on a right hand.
  const PALM = { l: 1, r: -1 };
  /** World direction out of the palm, right now. */
  function palmNormal(sd: Side) { root.updateMatrixWorld(true); return HF[sd].n.clone().multiplyScalar(PALM[sd]).applyQuaternion(TB["hand_" + sd].getWorldQuaternion(new THREE.Quaternion())).normalize(); }
  /** Centre of the palm in the world. */
  function palm(sd: Side) { return wpos("middle_01_" + sd).add(wpos("hand_" + sd)).multiplyScalar(0.5); }
  /** Tip of a finger in the world ("thumb" | "index" | "middle" | "ring" | "pinky"). */
  function tip(sd: Side, f: string) { const a = wpos(`${f}_02_${sd}`), b = wpos(`${f}_03_${sd}`); return b.clone().addScaledVector(b.clone().sub(a), 0.85); }
  /** Give a hand an exact world orientation: fingers point along `fingers`, the palm faces `palmDir`. */
  function orientHand(sd: Side, fingers: THREE.Vector3, palmDir: THREE.Vector3) {
    const f = fingers.clone().normalize();
    const n = palmDir.clone().multiplyScalar(PALM[sd]); n.addScaledVector(f, -n.dot(f)).normalize();
    const s = V().crossVectors(n, f);
    setWorldQuat("hand_" + sd, new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(f, s, n).multiply(HF[sd].m.clone().invert())));
  }
  /**
   * IK grip: put the PALM of a hand on a world point (a prop, a handle, a table edge). The elbow bends toward `pole`
   * (default: down and a little out). Call after the clip pose. Pass `hand` to set the hand's orientation in the same
   * solve (fingers along one world direction, palm facing another); then curl() the fingers. Three passes, because the
   * palm is offset from the wrist the solver moves.
   */
  function reach(sd: Side, target: THREE.Vector3, opts: { pole?: THREE.Vector3; hand?: { fingers: THREE.Vector3; palm: THREE.Vector3 } } = {}) {
    const { fwd, right } = basis();
    const pl = opts.pole ?? UPW.clone().multiplyScalar(-1).addScaledVector(right, sd === "r" ? 0.35 : -0.35).addScaledVector(fwd, -0.15);
    const tg = target.clone();
    for (let pass = 0; pass < 3; pass++) {
      ik2("upperarm_" + sd, "lowerarm_" + sd, "hand_" + sd, tg, pl);
      if (opts.hand) orientHand(sd, opts.hand.fingers, opts.hand.palm);
      tg.add(target.clone().sub(palm(sd)));
    }
  }
  const curlAxis = (sd: Side) => wpos("index_01_" + sd).sub(wpos("pinky_01_" + sd)).normalize();
  // which sign of rotation closes the fingers (measured once per hand, so it is right for both)
  const CURL = { l: 1, r: 1 };
  /** Close the four fingers by `amount` radians per joint, on top of the pose they are in (after openHand: 0.3 = soft hold, 0.6 = wrapped round a bar, 1.1 = fist). Thumb follows at `thumb`. */
  function curl(sd: Side, amount: number, thumb = amount * 0.8) {
    const ax = curlAxis(sd);
    for (const f of ["index", "middle", "ring", "pinky"]) for (const j of [1, 2, 3]) worldRot(`${f}_0${j}_${sd}`, ax, CURL[sd] * amount * (j === 1 ? 0.8 : 1));
    const t = wpos(`thumb_02_${sd}`).sub(wpos(`thumb_01_${sd}`)).normalize();
    const at = V().crossVectors(t, ax).normalize();
    for (const j of [2, 3]) worldRot(`thumb_0${j}_${sd}`, at, CURL[sd] * thumb);
  }
  /** Flat open hand (fingers at their rest pose). Call before curl() so the curl starts from open, not from the clip's fist. */
  function openHand(sd: Side) { for (const n of fingersOf(sd)) TB[n].quaternion.copy(restTL[n]); }
  const FSTAG: Record<string, number> = { thumb: 0, index: 0.007, middle: 0.016, ring: 0.024, pinky: 0.031 };
  /**
   * Let go: fingers open toward their rest pose, thumb and index first, the rest a few hundredths of a second behind
   * (never all at once). s = seconds since the release (on the same clock as the prop: slow the prop, slow this).
   */
  function release(sd: Side, s: number, dur = 0.035, stagger = 1) {
    for (const n of fingersOf(sd)) {
      const f = n.split("_")[0], j = +n.split("_")[1];
      const w = smooth(seg(s, (FSTAG[f] + j * 0.003) * stagger, (FSTAG[f] + j * 0.003) * stagger + dur));
      TB[n].quaternion.slerp(restTL[n], w * 0.92);
    }
  }
  /** Soften game-ready arms and fists toward a relaxed person (k 0..1). */
  function relax(k: number, sides = "lr") {
    for (const s of sides) {
      const sg = s === "l" ? 1 : -1;
      manRot("upperarm_" + s, V(0, 0, 1), -sg * 0.14 * k);
      manRot("lowerarm_" + s, V(0, 0, 1), -sg * 0.04 * k);
      for (const n of fingersOf(s as Side)) TB[n].quaternion.slerp(restTL[n], 0.62 * k);
    }
  }

  // ---------- life on top of the clip ----------
  /**
   * Breathing (0.27 Hz, chest then shoulders, about 6 mm at the chest: big enough to read on a phone) plus slow layered
   * sway. Call on EVERY held pose: a body that is perfectly still reads as a statue. k = amount (0.3 when he must be steady).
   */
  function breathe(t: number, k = 1) {
    const br = Math.sin(t * Math.PI * 2 * 0.27), br2 = Math.sin(t * Math.PI * 2 * 0.27 - 0.6);
    addRot("spine_02", -0.016 * br * k, 0, 0);
    addRot("spine_03", -0.02 * br * k, 0.008 * drift(t, 1) * k, 0.006 * drift(t, 2) * k);
    addRot("clavicle_l", 0, 0, 0.022 * br2 * k);
    addRot("clavicle_r", 0, 0, -0.022 * br2 * k);
    addRot("neck_01", 0.01 * br * k + 0.014 * drift(t, 5) * k, 0.024 * drift(t * 0.7, 3) * k, 0);
    TB.pelvis.position.x += 0.005 * drift(t * 0.6, 7) * k;
    TB.pelvis.position.z += 0.004 * drift(t * 0.5, 9) * k;
  }
  /** Turn the head: pitch (+ = down) and yaw (+ = to his left), radians. Pass a later-eased second pair as `head` so the neck leads and the head follows. */
  function look(neck: [number, number], head: [number, number] = neck) {
    addRot("neck_01", neck[0] * 0.55, neck[1] * 0.55, 0);
    addRot("Head", head[0] * 0.45, head[1] * 0.45, 0);
  }
  /**
   * A jolt that travels through the body and settles on a spring: shoulder first, chest 12 ms later, head 25 ms later.
   * s = seconds since the hit (same clock as the thing that hit). Use for recoil, a shove, a heavy catch, a landing.
   * dir: +1 pushes him back from his right shoulder; strength 1 = a rifle, 0.3 = a firm push.
   */
  function recoil(s: number, strength = 1, sd: Side = "r") {
    const ks = kick(s, 0) * strength, kc = kick(s, 0.012) * strength, kh = kick(s, 0.025) * strength, sg = sd === "r" ? 1 : -1;
    addRot("clavicle_" + sd, 0, -0.13 * ks * sg, 0);
    addRot("spine_03", -0.07 * kc, -0.06 * kc * sg, 0);
    addRot("spine_02", -0.035 * kc, 0, 0);
    addRot("spine_01", -0.02 * kc, 0, 0);
    addRot("neck_01", 0.08 * kh, 0.04 * kh * sg, 0);
  }

  // ---------- eyelids: a lid-coloured shell over each eye that sweeps down (the base mesh has no lid bones) ----------
  const lids: THREE.Group[] = [];
  {
    const g = eyeMesh.geometry, pos = g.attributes.position, sk = eyeMesh.skeleton;
    const hi = sk.bones.indexOf(TB.Head);
    const side = [{ c: V(), n: 0, r: 0 }, { c: V(), n: 0, r: 0 }];
    const p = V();
    for (let i = 0; i < pos.count; i++) { p.fromBufferAttribute(pos, i); const s = side[p.x > 0 ? 0 : 1]; s.c.add(p); s.n++; }
    side.forEach((s) => s.c.divideScalar(Math.max(1, s.n)));
    for (let i = 0; i < pos.count; i++) { p.fromBufferAttribute(pos, i); const s = side[p.x > 0 ? 0 : 1]; s.r = Math.max(s.r, p.distanceTo(s.c)); }
    const toHead = new THREE.Matrix4().copy(sk.boneInverses[hi]).multiply(eyeMesh.bindMatrix);
    const fH = V(0, 0, 1).transformDirection(toHead), uH = V(0, 1, 0).transformDirection(toHead);
    const xH = V().crossVectors(uH, fH).normalize();
    uH.crossVectors(fH, xH).normalize();
    const basisM = new THREE.Matrix4().makeBasis(xH, uH, fH);
    const scl = V();
    toHead.decompose(V(), new THREE.Quaternion(), scl);
    const lidMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.24, 0.12), roughness: 0.6, envMapIntensity: 0.4 });
    for (const s of side) {
      const holder = new THREE.Group();
      holder.position.copy(s.c.clone().applyMatrix4(toHead));
      holder.quaternion.setFromRotationMatrix(basisM);
      TB.Head.add(holder);
      const piv = new THREE.Group();
      holder.add(piv);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(s.r * scl.x, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
      cap.castShadow = false;
      piv.add(cap);
      lids.push(piv);
    }
  }
  /** 0 = eyes open, 1 = shut. Drive it with blinkAt(t) on held poses, or blinkPulse for a blink you place on purpose. */
  function setBlink(k: number) { for (const l of lids) l.rotation.x = lerp(-0.42, 1.62, k); }
  setBlink(0);

  // ---------- look: skin, clothes, hair (shader work on the base mesh, in its rest-pose space; no textures drawn) ----------
  const c3 = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(4)).join(", ")})`;
  const SHIRT = c3(opts.shirt ?? [0.22, 0.5, 0.86]);
  const TROUSERS = c3(opts.trousers ?? [0.235, 0.232, 0.215]); // stone grey: clearly cloth, far from skin in hue and value
  const SHOES = c3(opts.shoes ?? [0.11, 0.065, 0.035]);
  const REGION = `
    #define COLLAR 1.5470
    // 0 skin, 1 tee, 2 trousers, 3 shoe upper, 4 sole. p = rest-pose position (T-pose, metres, +z forward)
    float region(vec3 p) {
      float ax = abs(p.x);
      if (p.y < 0.026) return 4.0;
      if (p.y < 0.128) return 3.0;
      if (p.y < 1.035 && ax < 0.42) return 2.0;
      float r = length(vec2(p.x, p.z + 0.012));
      float collar = COLLAR + clamp((r - 0.07) * 1.0, 0.0, 0.1);
      if (p.y >= 1.0 && p.y < collar && ax < 0.365) return 1.0;
      return 0.0;
    }
    // hair: 1 on the top of the head, falling to 0 at the hairline
    float scalp(vec3 p) {
      float line = mix(1.668, 1.757, smoothstep(-0.035, 0.075, p.z));
      return smoothstep(line - 0.006, line + 0.02, p.y);
    }
    // clothes are the base body pushed out along the normal: looser shirt at the waist, flatter chest, straight trouser leg
    float clothOff(vec3 p, float rg) {
      float ax = abs(p.x);
      if (rg > 3.5) return 0.021; if (rg > 2.5) return 0.019;
      if (rg > 1.5) { float calf = 1.0 - smoothstep(0.40, 0.56, p.y); float thigh = smoothstep(0.55, 0.70, p.y) * (1.0 - smoothstep(0.95, 1.03, p.y)); float seat = smoothstep(0.78, 0.9, p.y) * smoothstep(-0.02, -0.08, p.z); float hem = 1.0 - smoothstep(0.13, 0.21, p.y);
        return 0.016 + 0.02 * calf + 0.012 * thigh + 0.012 * seat + 0.014 * hem; }
      if (rg > 0.5) { float waist = smoothstep(0.98, 1.08, p.y) * (1.0 - smoothstep(1.2, 1.36, p.y));
        float chest = smoothstep(1.27, 1.35, p.y) * (1.0 - smoothstep(1.45, 1.52, p.y)) * smoothstep(0.03, 0.1, p.z) * (1.0 - smoothstep(0.17, 0.25, ax));
        return 0.009 + 0.005 * waist - 0.02 * chest + 0.007 * smoothstep(0.25, 0.31, ax); }
      return -0.008 * smoothstep(0.34, 0.4, ax) * (1.0 - smoothstep(0.68, 0.74, ax));
    }
    float hairLen(vec3 p) { return mix(0.0025, 0.016, smoothstep(1.735, 1.79, p.y)) * scalp(p); }
  `;
  const body = bodyMesh.material as THREE.MeshStandardMaterial;
  body.normalScale.set(0.3, 0.3);
  body.envMapIntensity = 0.5;
  body.onBeforeCompile = (s) => {
    s.uniforms.skinTint = { value: new THREE.Color(1.42, 1.3, 1.22) };
    s.vertexShader = s.vertexShader.replace("#include <common>", `#include <common>\nvarying vec3 vRest;\n${REGION}`)
      .replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
        { float rgn = region(position); float axn = abs(position.x);   // cloth hides the anatomy: shade shirt and trousers from a smoothed normal
          if (rgn > 0.5 && rgn < 1.5) { vec3 cyl = normalize(vec3(position.x / 0.19, 0.0, (position.z + 0.01) / 0.125)); float kk = 0.78 * (1.0 - smoothstep(0.17, 0.25, axn)); objectNormal = normalize(mix(objectNormal, cyl, kk)); }
          else if (rgn > 1.5 && rgn < 2.5) { float lx = sign(position.x) * 0.105; vec3 cyl = normalize(vec3(position.x - lx, 0.0, position.z + 0.005)); float kk = 0.55 * (1.0 - smoothstep(0.86, 0.98, position.y)); objectNormal = normalize(mix(objectNormal, cyl, kk)); } }`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vRest = position; float rgv = region(position);
        transformed += normalize(objectNormal) * clothOff(position, rgv);`);
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\nvarying vec3 vRest; uniform vec3 skinTint; float rg;\n${REGION}
        float fold(vec3 p) { return sin(p.y * 61.0 + sin(p.x * 23.0) * 2.0 + p.z * 37.0) * 0.5 + 0.5; }`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        rg = region(vRest);
        if (rg > 3.5) diffuseColor.rgb = vec3(0.72, 0.69, 0.62);
        else if (rg > 2.5) diffuseColor.rgb = ${SHOES};
        else if (rg > 1.5) { vec3 cl = ${TROUSERS} * (0.95 + 0.05 * fold(vRest * 0.7));
          float ang = abs(atan(vRest.z + 0.004, abs(vRest.x) - 0.105)); cl *= 1.0 - 0.32 * (1.0 - smoothstep(0.03, 0.09, ang)) * step(0.18, vRest.y);   // outer side seam
          cl *= 1.0 - 0.22 * (1.0 - smoothstep(0.128, 0.15, vRest.y));                                                                              // hem
          if (vRest.y > 0.992) cl = mix(vec3(0.075, 0.05, 0.035), vec3(0.55, 0.5, 0.42), step(0.0, 0.022 - abs(vRest.x)) * step(0.0, vRest.z));       // belt, small buckle
          diffuseColor.rgb = cl; }
        else if (rg > 0.5) diffuseColor.rgb = ${SHIRT} * (0.94 + 0.06 * fold(vRest * 0.8));
        else { diffuseColor.rgb = min(diffuseColor.rgb * skinTint, vec3(1.0)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.037, 0.03), scalp(vRest) * mix(0.35, 0.92, smoothstep(1.70, 1.775, vRest.y))); }`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n if (rg > 2.5) roughnessFactor = 0.5; else if (rg > 0.5) roughnessFactor = 0.9; else roughnessFactor = max(roughnessFactor, 0.55);`)
      .replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>\n vec3 geoN = normal;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n if (rg > 0.5) normal = normalize(mix(normal, geoN, 0.85));`);
  };
  // hair: thin shells over the scalp (short crop on top, shorter at the sides)
  const SHELLS = 7;
  for (let i = 1; i <= SHELLS; i++) {
    const hm = new THREE.MeshStandardMaterial({ color: opts.hair ?? 0x17110d, roughness: 0.62, metalness: 0, side: THREE.FrontSide });
    const k = i / SHELLS;
    hm.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace("#include <common>", `#include <common>\nvarying vec3 vRest;\n${REGION}`)
        .replace("#include <begin_vertex>", `#include <begin_vertex>\n vRest = position; transformed += normalize(objectNormal) * hairLen(position) * ${k.toFixed(3)};`);
      s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\nvarying vec3 vRest;\n${REGION}
          float hh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
        .replace("#include <map_fragment>", `#include <map_fragment>
          float sc = scalp(vRest); if (sc < 0.75) discard;
          vec2 cell = floor(vec2(atan(vRest.x, vRest.z) * 150.0, vRest.y * 900.0)); if (hh(cell) < ${(k * 0.72).toFixed(3)} - 0.1) discard;
          diffuseColor.rgb *= 0.55 + 0.75 * ${k.toFixed(3)};`);
    };
    const sh = new THREE.SkinnedMesh(bodyMesh.geometry, hm);
    sh.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);
    sh.frustumCulled = false;
    sh.castShadow = false;
    (bodyMesh.parent as THREE.Object3D).add(sh);
  }
  // eyebrows: x = whole brow up/down, y = inner ends up/down (metres). brow.set(0.002, 0.004) = worried; (-0.002, -0.003) = braced.
  const brow = new THREE.Vector2(0, 0.0015);
  browMesh.material = new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 0.8, map: (browMesh.material as THREE.MeshStandardMaterial).map, alphaTest: 0.55, side: THREE.DoubleSide });
  browMesh.castShadow = false;
  browMesh.material.onBeforeCompile = (s) => {
    s.uniforms.brow = { value: brow };
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nuniform vec2 brow;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n transformed.y += brow.x + brow.y * (1.0 - smoothstep(0.012, 0.05, abs(position.x)));");
  };
  (eyeMesh.material as THREE.MeshStandardMaterial).roughness = 0.25;
  eyeMesh.castShadow = false;

  // ---------- one-time measurements (pure: the same on every load) ----------
  for (const sd of ["l", "r"] as Side[]) {   // curl sign: the one that moves the index fingertip toward the palm side
    for (const n of NAMES) TB[n].quaternion.copy(restTL[n]);   // rest pose: straight fingers, so the test is unambiguous
    const n = palmNormal(sd), before = tip(sd, "index").dot(n);
    worldRot(`index_01_${sd}`, curlAxis(sd), 0.3);
    CURL[sd] = tip(sd, "index").dot(n) > before ? 1 : -1;
  }
  // walk: metres per cycle measured from the feet, so the body travels at the speed the feet imply (no sliding)
  const stride = (() => { let lo = 1e9, hi = -1e9; const p = V(); const P = newPose(); for (let i = 0; i < 40; i++) { sample("Walk_Loop", (dur.Walk_Loop * i) / 40, P); SB.foot_l.getWorldPosition(p); lo = Math.min(lo, p.z); hi = Math.max(hi, p.z); } return (hi - lo) * 2 * HIP_K; })();
  /** Walk speed in m/s that matches the walk clip's feet. Move root by walkSpeed * seconds while playing Walk_Loop. */
  const walkSpeed = stride / dur.Walk_Loop;
  play("Idle_Loop", 0);

  return {
    root, bones: TB, dur, clips: Object.keys(dur), newPose, sample, blend, apply, capture, play,
    addRot, worldRot, manRot, setWorldQuat, aimBone, ik2, wpos, basis,
    reach, orientHand, openHand, curl, release, relax, palm, palmNormal, tip, fingersOf,
    breathe, look, recoil, setBlink, brow, walkSpeed, stride, restLocal: restTL,
  };
}
