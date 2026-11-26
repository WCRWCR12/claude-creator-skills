// The blue grid studio: one endless dark-blue room (glossy blue floor with white grid lines a metre apart and a soft
// reflection, a navy curved backdrop with a faint grid, soft top light, soft contact shadows) and the renderer that
// films it. Plain three.js, driven one frame at a time: render(t, frameFn) is a pure function of t.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { halton } from "./math";

/** What a shot returns: where the camera is, what it looks at, its lens. `lens` is the blur-disc radius in metres (0 = everything sharp; 0.006-0.012 = macro). */
export type Cam = { eye: THREE.Vector3; look: THREE.Vector3; fov?: number; lens?: number; up?: THREE.Vector3 | null };
/** Sets the whole scene for time t (seconds) and returns the camera. Must be pure: same t, same picture. */
export type FrameFn = (t: number) => Cam;

export type StudioOptions = {
  width?: number;
  height?: number;
  /** Soft mirror reflection in the floor. Costs one extra scene render per sample. */
  reflect?: boolean;
  floorColor?: string;
  lineColor?: string;
  wallColor?: string;
  wallLineColor?: string;
};

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export type Studio = ReturnType<typeof createStudio>;

export function createStudio(canvas: HTMLCanvasElement, opts: StudioOptions = {}) {
  const W = opts.width ?? 1080, H = opts.height ?? 1920;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping; // tone-mapped in the grade pass below
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });

  const scene = new THREE.Scene();
  const NAVY = new THREE.Color(0x061a36);
  scene.background = NAVY;
  scene.fog = new THREE.Fog(0x0a2a55, 16, 70);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.02, 400);

  // ---- the room ----
  const gridTex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = opts.floorColor ?? "#2d7cc6";
    g.fillRect(0, 0, w, w);
    g.fillStyle = opts.lineColor ?? "#eef6ff";
    const lw = 22;
    g.fillRect(0, 0, w, lw / 2); g.fillRect(0, w - lw / 2, w, lw / 2); g.fillRect(0, 0, lw / 2, w); g.fillRect(w - lw / 2, 0, lw / 2, w);
  });
  gridTex.repeat.set(300, 300); // 300 m floor, one tile a metre
  const reflect = opts.reflect !== false;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.3, metalness: 0, envMapIntensity: 1, transparent: reflect, opacity: reflect ? 0.86 : 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  if (reflect) {
    const mirror = new Reflector(new THREE.PlaneGeometry(300, 300), { textureWidth: W / 3, textureHeight: H / 3, color: 0x8899aa, clipBias: 0.003 });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = -0.003;
    scene.add(mirror);
  }
  const wallTex = canvasTexture(512, 512, (g, w) => {
    g.fillStyle = opts.wallColor ?? "#0a2850";
    g.fillRect(0, 0, w, w);
    g.fillStyle = opts.wallLineColor ?? "#1d4a82";
    g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, w);
  });
  wallTex.repeat.set(200, 22);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(64, 64, 44, 128, 1, true), new THREE.MeshBasicMaterial({ map: wallTex, side: THREE.BackSide, fog: false }));
  wall.position.y = 22;
  scene.add(wall);

  // ---- light: one soft key that follows the camera round (so the glossy floor never glares), sky fill, cool rim ----
  const SUN_DIR = V(-0.42, 0.86, 0.5).normalize();
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.012;
  sun.shadow.radius = 5;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x2d6fb4, 0.62));
  const rim = new THREE.DirectionalLight(0xa9cdfd, 0.7);
  rim.position.set(3, 4, -6);
  scene.add(rim);

  // ---- camera with a thin lens (sub-frame samples give depth of field, motion blur and soft shadow edges) ----
  const rightV = V(), upV = V();
  function shoot(cm: Cam, k: number, n: number) {
    camera.fov = cm.fov ?? 30;
    camera.aspect = W / H;
    camera.position.copy(cm.eye);
    camera.up.copy(cm.up || UP);
    camera.lookAt(cm.look);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    if (n === 1) return;
    const F = cm.eye.distanceTo(cm.look), lens = cm.lens ?? 0.003;
    const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * Math.PI * 2, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
    rightV.setFromMatrixColumn(camera.matrixWorld, 0);
    upV.setFromMatrixColumn(camera.matrixWorld, 1);
    camera.position.addScaledVector(rightV, lx).addScaledVector(upV, ly);
    camera.updateMatrixWorld();
    const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
    e[8] += (-e[0] * lx) / F + (2 * jx) / W;
    e[9] += (-e[5] * ly) / F + (2 * jy) / H;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  function aimSun(cm: Cam, k: number, n: number) {
    const c = cm.look, r = Math.max(2.4, Math.min(12, cm.eye.distanceTo(cm.look) * 0.9));
    const j = n > 1 ? V((halton(k + 1, 11) - 0.5) * 0.09, 0, (halton(k + 1, 13) - 0.5) * 0.09) : V();
    const topDown = Math.abs(cm.eye.x - c.x) + Math.abs(cm.eye.z - c.z) < 0.3;
    const yaw = Math.atan2(cm.eye.x - c.x, cm.eye.z - c.z);
    scene.environmentRotation.set(0, yaw, 0);
    const sd = SUN_DIR.clone().applyAxisAngle(UP, topDown ? 0 : yaw); // light from behind-left of the lens
    sun.target.position.copy(c);
    sun.position.copy(c).addScaledVector(sd.add(j).normalize(), 30);
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 80 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  // ---- passes: add sub-frames together, then tone-map (ACES), convert to sRGB, add a breath of grain ----
  const vert = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
  const addMat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
    fragmentShader: "uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }",
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true,
  });
  const addPass = new FullScreenQuad(addMat);
  const gradeMat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: accum.texture }, seed: { value: 0 }, exposure: { value: 0.62 } }, vertexShader: vert,
    fragmentShader: `uniform sampler2D tex; uniform float seed, exposure; varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
      vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      void main() { vec3 c = srgb(aces(texture2D(tex, vUv).rgb * exposure)); c += (h(vUv * 1000.0) - 0.5) * 0.012; gl_FragColor = vec4(c, 1.0); }`,
    depthTest: false, depthWrite: false,
  });
  const grade = new FullScreenQuad(gradeMat);

  /**
   * Draw the frame at time t. `samples` sub-frames are spread over half a frame of time (a 180 degree shutter) and over the
   * lens: 1 = fast and sharp (drafts, stills while blocking), 4 = default, 12-20 = final (real motion blur and focus fall-off).
   * `fps` is only used for the shutter length. Optional t0/t1 keep the sub-frames inside the current shot so a cut never smears.
   */
  function render(t: number, frameFn: FrameFn, samples = 4, fps = 30, t0 = -Infinity, t1 = Infinity) {
    const n = Math.max(1, Math.round(samples));
    renderer.setRenderTarget(accum);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    for (let k = 0; k < n; k++) {
      const dt = n > 1 ? ((k + 0.5) / n - 0.5) * (0.5 / fps) : 0;
      const tk = Math.min(Math.max(t + dt, t0), t1 - 1e-4);
      const cm = frameFn(tk);
      scene.updateMatrixWorld(true);
      renderer.setRenderTarget(rt);
      renderer.setClearColor(NAVY, 1);
      renderer.clear();
      shoot(cm, k, n);
      aimSun(cm, k, n);
      renderer.render(scene, camera);
      addMat.uniforms.tex.value = rt.texture;
      addMat.uniforms.w.value = 1 / n;
      renderer.setRenderTarget(accum);
      renderer.autoClear = false;
      addPass.render(renderer);
      renderer.autoClear = true;
    }
    gradeMat.uniforms.seed.value = (t * 30) % 97;
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, W, H);
    grade.render(renderer);
  }

  function dispose() {
    rt.dispose();
    accum.dispose();
    renderer.dispose();
  }

  return { W, H, renderer, scene, camera, floor, wall, sun, render, dispose, exposure: gradeMat.uniforms.exposure };
}

/** A straight camera move across one shot: u = seconds into the shot, D = its length. Small moves: 3-6% of the frame a second. */
export function cam(u: number, D: number, e0: THREE.Vector3, e1: THREE.Vector3, l0: THREE.Vector3, l1: THREE.Vector3, fov = 30, lens = 0.003, up: THREE.Vector3 | null = null): Cam {
  const k = u / D;
  return { fov, lens, eye: e0.clone().lerp(e1, k), look: l0.clone().lerp(l1, k), up };
}
