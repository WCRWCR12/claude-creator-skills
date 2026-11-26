# Third-party notices

## Bundled
| Component | Path | Licence | Notes |
|---|---|---|---|
| "Universal Base Characters" by Quaternius: Superhero Male, full body (mesh, 65-bone rig) | `kit/public/myth/Superhero_Male_FullBody.gltf`, `Superhero_Male_FullBody.bin` | CC0 1.0 (public domain) | The `.gltf` (JSON half) was rebuilt from the `.bin` so the two files load together; geometry and rig are unchanged. |
| Textures from the same pack | `kit/public/myth/T_Superhero_Male_Dark.png`, `T_Superhero_Male_Normal.png`, `T_Superhero_Male_Roughness.png`, `T_Hair_1_BaseColor.png`, `T_Eye_Brown.png` | CC0 1.0 | Normal, roughness and hair maps were resized from 2048 to 1024 px and the PNGs re-compressed, to keep the pack small. |
| "Universal Animation Library" (Standard) by Quaternius: 45 animation clips on its mannequin | `kit/public/myth/UAL1_Standard.glb` | CC0 1.0 | Unmodified. The clips are retargeted onto the character at render time by `kit/src/lib/myth/man.ts`. |
| cinematic-director skill (v2.0.0, author wangzhang-wu) | `.claude/skills/cinematic-director/` | MIT | Included unmodified with its LICENSE file. Its model adapters mention AI video/image tools; the pack uses it for direction vocabulary (shots, lenses, lighting, blocking), not for generation. |

Source of the Quaternius files: the author's free packs (quaternius.com), fetched from a public mirror that carries a CC0 1.0 licence file and the statement that the models and animations are by Quaternius and also CC0 (codeberg.org/jamesonBradfield/Quaternius_IK_Rigged_with_animations, commit 0cc5dc35). CC0 needs no credit; it is given here anyway. The character's clothes, hair, brows and eyelids are shader and geometry work in `man.ts`, written for this pack.

All other files (skills, agents, knowledge base, kit source, tools, and the synthesised audio in `kit/public/sfx/` and `kit/public/myth/pad-example.wav`) were written for this pack and are MIT (see `LICENSE`). The audio is generated from code by `tools/make_sfx.py` and `tools/make_pad.py`, with no samples.

## Installed at setup (not bundled)
`npm install` in `kit/` downloads these from npm under their own licences:
| Package | Licence |
|---|---|
| remotion, @remotion/cli, @remotion/three | Remotion License: free for individuals, non-profits and companies up to 3 people; larger companies need a company licence. See https://www.remotion.dev/license |
| three | MIT |
| @react-three/fiber | MIT |
| react, react-dom | MIT |
| @fontsource/montserrat (the caption font, Montserrat ExtraBold) | SIL Open Font License 1.1 |
| typescript | Apache-2.0 |

Python (optional, `pip install -r tools/requirements.txt`): numpy (BSD-3), scipy (BSD-3), faster-whisper (MIT), matplotlib (PSF-based). ffmpeg is installed separately by the user (LGPL/GPL depending on build).
