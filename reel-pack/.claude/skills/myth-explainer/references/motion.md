# The man: motion that reads as a person

A viewer forgives a simple face. They do not forgive a body that moves like a puppet. Judge motion from the video or from dense frame strips (every frame of the beat, tiled), never from single stills.

## Where motion may come from, in order of preference
1. **A library clip** on the rigged man (45 are bundled: walk, jog, idle, push, pick up from a table, interact, sit, drive, swim, crouch, jump, roll, hit, fall and more; the list is `CLIPS` in `kit/src/lib/myth/man.ts`).
2. **Physics** you compute: gravity, bounce, a dropped prop turning as it falls.
3. **A held pose of 1.2 s or less** that breathes, sways and blinks.

Anything else gets cut, or reframed to hands and props. Easing from one clip into another takes 0.1-0.5 s with `blend`; hide stance changes behind a cut, because feet slide during a blend.

## Three lessons (they took a test cut's motion score from 4 to 6.5 out of 10)
1. **Big enough for a phone.** The frame is about 6 cm wide in the hand. Breathing about 6 mm at the chest, wrist lag about 0.5 rad, a flinch 5-8 cm. Subtle reads as stiff.
2. **Wind up, arc, settle.** Anticipation first, then a curved path, then overshoot and a spring back. Limbs and fingers start 50-120 ms apart, never all at once.
3. **One clock.** The body and the props run off the same physics time, so when the object is slowed, the man is slowed with it.

## The helpers (all pure functions of time)
| Need | Helper | Notes |
|---|---|---|
| Life in a held pose | `man.breathe(t, k)` | Chest, then shoulders a beat later, plus slow sway. k = 1 normal, 0.3 when he must be steady. Call on every pose |
| Blinks | `man.setBlink(blinkAt(t))`, `blinkPulse(u, at)` | A schedule every 2.4-4.2 s, or one blink placed on purpose in a close shot |
| A look | `man.look(neck, head)` | Pass a later-eased pair for the head so the neck leads and the head follows |
| A jolt through the body | `man.recoil(s, strength)`, `kick(s, delay)` | A sharp kick into a damped spring: shoulder at 0 ms, chest at 12 ms, head at 25 ms. For a shove, a heavy catch, a landing, a tool kicking back. Apply `kick` to the prop too so they move as one |
| A hand on a prop | `man.reach(side, point, { hand: { fingers, palm } })` | Two-bone IK that puts the palm on a world point and sets the hand's orientation. Stand him close enough: an arm at full stretch looks wrong and misses |
| A grip | `man.openHand(side)` then `man.curl(side, amount)` | 0.3 soft hold, 0.6 wrapped round a bar, 1.1 fist |
| Letting go | `man.release(side, s)` | Thumb and index first, the others hundredths of a second behind, on the prop's clock |
| Softer arms | `man.relax(k)` | The library's idle is a ready stance with fists; this opens it toward a relaxed person |
| Walking without sliding | `man.walkSpeed` | Move him at this many metres a second while `Walk_Loop` plays |
| Any other bone | `man.addRot`, `man.worldRot`, `man.aimBone`, `man.ik2` | Use sparingly, on top of a clip |

Springs and overshoot for props: `spring(t, hitTime, freq, decay)`, `backOut(k)`, `bounceY(...)`.

## Hands in close-up
- **Arcs:** a hand travels on a curve with ease-in-out, never a straight line, and the wrist turns during the travel.
- **Anticipation:** fingers open wider before a grasp; the hand dips and squeezes 0.4-0.6 s before a release.
- **Lag:** the wrist trails the forearm on arrival and lift, and leads on a reach.
- **Stagger:** thumb and index first on a release; index, then middle, ring and little finger on a grasp.
- **Settle:** damped springs on arrival and on the prop when let go (it rocks).
- **Exit with follow-through:** leave on an arc with the wrist trailing. A fast straight snap reads robotic.
- **Solve contact, do not guess it:** search the finger angles until the pads are exactly one prop-width apart, then attach the prop to the midpoint.

## Known limits of this man (say so in your notes rather than hide it)
He is a game-style rig: a stocky build even after slimming, heavy brows, no cloth or hair movement, lids that are simple shells, a fall that is a canned clip and so identical every time, and feet that slide if a stance change is on screen. Frame and cut around these.
