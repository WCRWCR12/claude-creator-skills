---
name: build-short-3d
description: The 3D "how it's built" short. One continuous camera move while a structure or machine assembles itself piece by piece in true 3D (a dam, a battery inside a mountain, an engine, a castle). No cuts, no presenter, minimal text. Use for "show how X is built", "how X becomes Y", infrastructure, machinery and natural-process explainers.
---

# 3D build short

## What it is
A single continuous shot. The camera holds or orbits slowly while pieces arrive and lock into place in the order a builder would place them, until the finished thing works. The build IS the video. 30-90 s, 9:16, faceless, narration plus cinematic sound.

## Recipe
1. **One sentence in**: "how a hole in a mountain becomes a giant battery".
2. **List the stages in build order** (foundations first, working parts last), 6-12 stages. Each stage = one group of meshes in the scene.
3. **Camera**: one path for the whole video (`CamKey[]` with 3-6 keys): start wide on the empty site, drift in and round as stages land, end on a slow orbit of the finished thing working. Never cut.
4. **Arrivals**: each part comes in from where it would really come from (dropped from above by a crane, slid in on rails, grown up out of the ground), eases in, overshoots a few centimetres and settles with a small dust puff and a clank. Stagger parts within a stage by 80-150 ms.
5. **Payoff**: the system runs (water flows, wheels turn, lights come on); one line names it.
6. **Narration**: one sentence per stage, said as the stage lands. Labels only where a name matters, lower third.
7. **Sound**: a low bed that grows with the build, a soft thud/clank on each part, a bigger hit when it starts working.

## Rules
- Clean, lit 3D with real materials; low-to-mid poly is fine if the light is good.
- Order matters: a viewer should be able to see how it goes together. Never a scrap heap flying in.
- Keep scale cues in frame (a truck, a person, trees).
- Use `scene-3d` for the technique and kit helpers.
