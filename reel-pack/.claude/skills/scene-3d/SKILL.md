---
name: scene-3d
description: Build cinematic 3D shots in code with three.js inside Remotion (react-three-fiber), rendered frame by frame: a lit world, a camera that moves through it, motion with weight, smoke/sparks/flashes, screen shake, film grain. Use for any 3D animation, "cinematic" shot, vehicle/object/scene animation, or when the user says "3D", "camera move", "orbit", "fly through", "POV".
---

# 3D scenes in code

The kit in `kit/` is a Remotion project with `@remotion/three`. A scene is a React component; every value is a **pure function of the frame number** (`useCurrentFrame()`), so renders are deterministic and can be split across browser tabs. Never use `Math.random()`, `Date.now()` or react-three-fiber's `useFrame` clock: use `random(seed)` from `remotion` and the frame.

## The ground truth: camera through a built scene
Build the whole world first (ground, set, props, characters, light), then move a virtual camera through it. The camera move IS the animation. Things do not pop, bounce or slide onto a flat canvas.

Named moves (pick one or two per shot, 1.2-3 s each, let it breathe):
| Move | Use it for | How (camera keys) |
|---|---|---|
| Pull back | reveal scale or context | start close on the subject, end wide; ease out |
| Push in | intensity, "look at this" | slow, 5-15% closer over the shot |
| Crane up + land | arrival, "you are here" | start high and wide, drop down and in, land at eye level |
| Orbit / 360 | show a hero object from all sides | `orbitKey()` at several angles around the target |
| Tracking / follow | something moving (vehicle, projectile) | camera keys move with the subject, offset to one side, low |
| Dolly zoom | unease, realisation | camera moves in while fov widens (or out while it narrows) |
| POV | put the viewer there (a projectile, a driver, a person) | camera at the subject's position, looking along its path |
| Zoom-through | transition between two places | fly through a gap/window/object into the next set |

Lens feel (vertical fov on 9:16): 55-70 wide/establishing, 35-45 normal, 20-28 long lens (compressed, heavy). Camera height says a lot: low (0.5-1.5 m) makes things big and heavy; eye level is neutral; high is a map.

## Build order (do it in this order, every time)
1. **Camera keys** (`CamKey[]` in `lib/camera.tsx`): start pose, end pose, ease, duration. Write them before anything else.
2. **World in metres**, real proportions: a tank hull is ~6-7 m long, a door 2 m tall, a person 1.75 m. Ground plane large (200-400 m) so the horizon never shows an edge. Scatter scale cues (rocks, posts, grass clumps) with a fixed pattern.
3. **Light** (`lib/lighting.tsx`): warm key (low sun) with shadows, cool fill (hemisphere, 20-30% of the key), a rim from behind so the subject's edge separates, and fog (`fogExp2`) tinted to the sky so distance reads. Readability first: if the subject is not clearly lit at phone size, add light, never flatten the scene into a diagram.
4. **Events**: one `const` per key moment (`const FIRE = 54;`). FX, shake, sound and text all key off these, so they line up by construction.
5. **Motion with weight**: nothing moves linearly. Use eases for travel, `springKick()` for recoil/impacts/settles (overshoot, then settle), anticipation before a big action (a small move the other way), follow-through after (parts keep moving and settle). Secondary motion: antennas sway, suspension rocks, dust lingers.
6. **FX** (`lib/fx.tsx`): `Flash` (2-4 frames + a point light that lights the scene), `Smoke` (billows, rises, drifts with wind, thins), `Debris` (ballistic arcs with gravity, hot sparks cool), `DustRing` (ground shock), `Tracer` (fast projectile), and camera shake via `CameraRig hits={[{ f: FIRE, strength: 0.15 }]}`.
7. **Overlays** (`lib/overlays.tsx`): `LowerThird` text in the lower third only, `Grain` at 5-8% for texture, optional `HitFlash` (soft, a few frames).
8. **Sound**: `<Sequence from={FIRE}><Audio src={staticFile("sfx/boom.wav")} /></Sequence>`. Generate starter SFX with `python tools/make_sfx.py kit/public/sfx` (boom, impact, debris, whoosh, rumble loop, clank, tick, riser, drone bed). Sound on the key moments, not on every movement.

## Ready-made models
- `kit/src/lib/models/Tank.tsx`: a WW2-style medium tank (~6.6 m) with turning road wheels, advancing track links, turret yaw, gun pitch, barrel recoil, suspension pitch/roll, antenna sway. Drive everything from the frame, e.g. `distance={speed * t}`, `recoil={springKick(t - fireT, 0.45)}`. `tankMuzzleWorld({...same props})` returns the muzzle position and barrel direction for `Flash streak`, `Smoke direction` and `Tracer from`.
- Use it as the pattern for new models: one component, real sizes, every moving part a prop.

## Framing (9:16)
- Establishing shot: the whole hero in frame with some ground around it; it fills about 40-70% of the frame width. Close-ups come after the viewer knows what the thing is.
- Use `fitDistance(width, height, fov)` with the subject's FULL extent as seen (a tank includes its gun: `TANK.overallLength` = 9.8 m, centred at `TANK.centerX`). A vertical frame is narrow: a side-on vehicle needs the camera much further back than you expect.
- Consecutive `orbitKey`s travel round the arc. Plain keys far apart are lerped in a straight line and can cut through the subject: check a still mid-move.

## Modelling with primitives (no downloads needed)
Most hero objects can be built from boxes, cylinders, spheres and lathes grouped together. Make them read:
- **Silhouette first**: get the big shapes and proportions right from the camera's angle; detail where the camera looks.
- **Bevel the eye**: add small parts that catch light (hatches, rivets as tiny cylinders, panel lines as thin boxes slightly proud of the surface).
- **Materials**: `meshStandardMaterial` with roughness 0.6-0.95 and a little metalness for metal; vary the colour slightly between parts so it is not one flat colour; darker, rougher lower parts read as dirt.
- **Wheels and tracks**: wheels are cylinders rotated 90 degrees on Z; spin them by distance travelled / radius. Tracks: a loop of small boxes positioned along a path and advanced by distance travelled.
- **Free models**: if a primitive build is not good enough after two tries, a CC0 or CC-BY `.glb` can be loaded with three's `GLTFLoader` (add `@react-three/drei` or load it yourself inside `delayRender`). Credit CC-BY authors in the caption.

## Check before rendering the whole thing
- `npx remotion still src/index.ts <Comp> out/f.png --frame=<n>` at 3-4 key frames (start, the event, just after, end). Look at each one at phone size. Fix framing, light, scale, intersections first.
- Draft render with `--scale=0.5`, then a contact sheet; judge motion from consecutive frames or the video, never from one still.
- Full render. Then `tools/check_flash_cuts.py` and `tools/sound_check.py`.

## Troubleshooting
- **Black frames**: the GL renderer. `remotion.config.ts` sets `angle`; on a Linux box without a GPU try `--gl=swangle`.
- **Camera does not move**: the `CameraRig` must be inside `<ThreeCanvas>`; keys need increasing `f`.
- **Flicker between frames**: something uses `Math.random` or a clock. Use `random("seed-" + i)` and the frame.
- **Shadows missing**: `shadows` on `<ThreeCanvas>`, `castShadow` on the light and meshes, `receiveShadow` on the ground; widen the shadow camera if the subject is outside it.
- **Slow render**: lower `count` on Smoke/Debris, reduce shadow map size, or render at `--scale=0.5` for drafts.
