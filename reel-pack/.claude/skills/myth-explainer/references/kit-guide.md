# Building a myth scene with the kit

Everything is in `kit/src/lib/myth/` and is imported from `"../lib/myth"`. Start by copying `kit/src/scenes/MythTwoBalls.tsx` and registering your copy in `kit/src/Root.tsx`.

## The pieces
| Piece | What it is |
|---|---|
| `<MythStage setup={...} shots={SHOTS} samples={6} />` | The blue grid studio as a Remotion layer. `setup(studio)` runs once: build props, `await loadMan(...)`, and return a frame function |
| frame function `(t) => Cam` | Puts everything where it is at time t (seconds) and returns the camera `{ eye, look, fov, lens, up }`. It must be pure: same t, same picture. No `Math.random()`, no state kept between calls |
| `shots([["A1", 0.9], ...])`, `shotAt` | The shot list. Throws if any shot is under 0.6 s |
| `cam(u, D, eye0, eye1, look0, look1, fov, lens)` | A straight camera move across one shot. `lens` is the blur disc in metres: 0 sharp, 0.003 normal, 0.006-0.012 macro |
| `<MythCaptions chunks={[[0, "IF YOU"], ...]} />` | The caption layer. Throws on a chunk of more than 3 words. `paceChunks("IF YOU / ROLLED", 0, 190)` paces a draft before there is a voice |
| `loadMan(studio, { base: staticFile("myth/") })` | The rigged man. Options: `shirt`, `trousers`, `shoes` (linear RGB), `hair`, `upperScale` |
| `makeTrail`, `trailOf`, `makeDust`, `setDust`, `bounceY`, `fallTime`, `makeTable` | Small effects and physics |
| `tools/make_pad.py`, `tools/make_sfx.py` | The held pad and code-made sounds (knock, thud, whoosh, tick, impact and more) |

## Pattern for a scene
```tsx
const SHOTS = shots([["A1", 0.9], ["A2", 1.0]]);                    // 1. shot list
const CAPTIONS: Chunk[] = [[0, "IF YOU"], [0.4, "DROPPED"]];        // 2. captions; every shot starts on a chunk
async function setup(studio: Studio) {
  const man = await loadMan(studio, { base: staticFile("myth/") });
  // 3. build props once (three.js meshes added to studio.scene), in metres
  const SH: Record<string, (u: number, D: number, t: number) => Cam> = {   // 4. one function per shot
    A1(u, D, t) { man.root.position.set(0, 0, 0); man.play("Idle_Loop", t); man.breathe(t); return cam(u, D, V(0, 1.5, 4), V(0.1, 1.5, 3.9), V(0, 1.2, 0), V(0, 1.2, 0)); },
  };
  return (t: number) => { man.root.visible = true; const s = shotAt(SHOTS, t); return SH[s.id](t - s.t0, s.t1 - s.t0, t); };
}
```
Each frame, in this order: place `man.root`, `man.play(clip, time)`, then life (`relax`, `breathe`, `look`), then hands (`reach`, `openHand`, `curl`, `release`), then `setBlink`.

## Coordinates and scale
Metres. y is up, the floor is y = 0, grid lines are a metre apart. The man is about 1.8 m tall and faces +z at rotation 0. The frame is 9:16, so it is narrow: at fov 30 a camera 3 m away sees about 1.6 m of height and only 0.9 m of width. Wide set-ups need distance or the top-down map shot.

## Commands (from `kit/`)
- One frame, fast: `npx remotion still src/index.ts <Id> out/f.jpg --frame=45 --image-format=jpeg --props='{"samples":1}'`
- Draft video: `npx remotion render src/index.ts <Id> out/draft.mp4 --props='{"samples":1}' --scale=0.5`
- Final: `npx remotion render src/index.ts <Id> out/final.mp4 --props='{"samples":12}'` then `python ../tools/finish_audio.py out/final.mp4`
- Pad: `python ../tools/make_pad.py public/myth/pad-<slug>.wav --seconds 30 --root D`

For `--props` to work, give your composition `defaultProps={{ samples: 6 }}` as the example does. On Windows PowerShell, put the JSON in a file and pass `--props=props.json`.

## Blocking order (stills are cheap, renders are not)
1. One single-sample still in the middle of every shot. Tile them into a sheet and look.
2. Fix framing first: is the subject in frame, is the caption band clear, is the man's head cropped?
3. Then hands: a still just before and just after each contact or release, cropped at full size.
4. Then one draft render, a 2 fps contact sheet, and frame strips of the moving shots.

## Things that go wrong
- **Hand hovers beside the prop:** the target is out of reach. Move `man.root` closer (a comfortable reach is under 0.45 m from the shoulder).
- **Fingers already a fist:** the clip's hands are closed. Call `man.openHand(side)` before `curl`.
- **He faces away from the action:** remember which side the camera is on. A camera at -z looking toward +z shows +x on the left.
- **The frame is full of his hips or legs:** a low shot of a falling prop was aimed at the man. Aim at the prop and the floor, from the side, with him at the frame edge or out of shot. Never centre a frame on his waist.
- **He stands like a boxer:** `Idle_Loop` is a wide ready stance. Frame him from the chest up, or use him mid-action (`PickUp_Table`, `Interact`, `Walk_Loop`), where the stance reads as natural.
- **A held prop hides his face:** hold it at chest height and to the side, not at the shoulder.
- **Small prop invisible:** draw it bigger (`mesh.scale`) and say so in your notes.
- **Black or failed render:** see the GL note in the README (`--gl=swangle` on a machine with no GPU).
- **First frame takes long:** the character and clip library (about 12 MB) load once per render tab.
