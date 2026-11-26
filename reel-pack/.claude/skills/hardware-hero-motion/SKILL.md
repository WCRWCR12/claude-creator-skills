---
name: hardware-hero-motion
description: Make vehicles, weapons and machines (tanks, artillery, aircraft, ships, engines) look like a war film or a teardown, not a diagram. Low tracking cameras, golden-hour light with haze, moving mechanical parts, recoil with weight, muzzle blast, shell POV and kill-cam, plus an accuracy check. Use with scene-3d whenever a machine is the hero of a shot.
---

# Hardware hero motion

Start from `kit/src/lib/models/Tank.tsx` for tanks (and as the pattern for other vehicles): wheels, tracks, turret, gun pitch, recoil and suspension are already props, and `tankMuzzleWorld()` gives the muzzle position for FX.

The viewer should think "is that real footage?" or "I can see exactly how that works", never "that's a 3D model". Build with `scene-3d` and the kit helpers; this skill adds the hardware checklist.

## The look
| Check | Standard |
|---|---|
| Model | Real proportions and the parts people recognise: round road wheels, individual track links, hatches, antenna, gun mantlet, muzzle brake, mud on the lower hull. Look at real reference photos first and list the parts. |
| Camera height | At track/wheel height (0.5-1.5 m) or below for hero shots. Never an overhead view on a hardware hero shot. |
| Camera moves | Tracking beside the hull as it drives; slow orbit around a stationary hull; commander's-hatch POV; projectile POV; push-in on the part that matters. |
| Light | Warm golden-hour key (low sun), cool sky fill at 20-30% of the key, rim light on the turret/fuselage edge. |
| Atmosphere | Haze on every outdoor shot (`fogExp2` ~0.006-0.015, tinted to the sky). Dust kicked up by tracks, smoke that lingers. |
| Materials | `meshStandardMaterial`, roughness 0.6-0.9, a little metalness; vary tones between parts; darker, rougher lower hull. No single flat colour. |
| Motion | A driving vehicle has turning wheels, advancing tracks, a slight body roll and pitch on its suspension, and a trail of dust. A parked one still idles (tiny engine shake, antenna sway). |
| Firing | Anticipation (a held beat, the turret settles), muzzle flash 2-4 frames + light on the scene, barrel recoil with a spring settle (`springKick`), hull rocks back, muzzle smoke billows forward then drifts, dust ring on the ground, camera shake, a boom on the same frame. |
| Hit | The projectile visibly travels (tracer), the part it hits flashes or explodes, sparks + debris + smoke, the target rocks. If the point is WHICH part was hit, show it clearly (an X-ray push-in or the part glowing red). |

## Shot recipes
- **Distance**: `fitDistance(length, height, fov)` from `lib/camera.tsx`, using the length INCLUDING the gun. For the kit tank: `fitDistance(TANK.overallLength, TANK.height, 38)` (about 33 m side-on at fov 38) aimed at `[TANK.centerX, 1.4, 0]`. Go closer only for details after the viewer knows what it is, and check that the muzzle is inside the frame on the fire frame.
- **Firing angle**: 40-140 degrees off the barrel axis. Straight down the barrel hides the gun and the flash.
- **Drive-by 360**: camera low, orbiting while the vehicle drives slowly on a straight line; the orbit centre moves with the vehicle.
- **Fire, side-on**: long lens (fov 25-30) from 15-25 m, camera at hull height; the muzzle blast pushes smoke along the barrel axis (`Smoke direction={[axis]}`, `Flash streak={axis}`).
- **Projectile POV**: camera rides just behind the projectile looking along its path, slight roll; target grows in frame; cut or punch through on impact. Keep it at least 0.6 s.
- **Kill-cam**: freeze or slow (drive every animation from one `slowT` variable so everything slows together), camera moves to the hit point, the hit part flashes, then normal speed for the explosion.
- **Teardown/cutaway**: hide the outer shell (or fade it to 15-25% opacity) to show moving internals (pistons, gears, breech); label each part in the lower third as it moves.

## Accuracy gate (before calling it done)
1. **Context**: does the scene make physical sense? Vehicles in a column are spaced several lengths apart and offset, never nose-to-tail or clipping. Tracks/wheels sit on the ground. Scale right next to people and buildings. The gun points at what it hits. Terrain, season and time of day match the story.
2. **Components**: compare full-resolution frames (not phone-size thumbnails) against real reference photos: gun length, muzzle brake, mantlet, turret position, wheel count, sprocket, hull guns. Missing, floating or wrong parts fail.
3. **Physics**: muzzle velocity, fall times and distances computed from real numbers; if the shot is slowed, say so on screen and slow everything by the same factor.

## Sound
Engine rumble loop (`rumble.wav`) under driving shots, a clank on track/mechanism moments, a boom on every shot fired, an impact + debris on every hit. Music low and serious under it (skill `sound-and-music`). Sound check must PASS.
