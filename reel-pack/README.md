# Reel Pack for Claude Code (v2)

A drop-in studio that makes Claude Code produce 9:16 reels **in code**: lit 3D scenes with real camera moves, a rigged human character, captions and sound, rendered frame by frame with Remotion and three.js. No AI video generation, no credits, and every render is repeatable.

New in v2: the **myth-explainer** style. A silent man in a blue grid studio tests a "what would really happen" idea in one-second shots with 1-3 word captions.

What's inside:
- **15 skills**: `reel-studio` (the front door), `myth-explainer` (new), `scene-3d`, `hardware-hero-motion`, five more reel formats, `hooks-and-scripts`, `vo-delivery-direction`, `sound-and-music`, `first-time-viewer`, `video-contact-sheet`, and the MIT-licensed `cinematic-director`.
- **A crew of 6 agents**: director, writer, contextualiser (fact checker), cinematographer, music director, first-time viewer (cold test screening).
- **A knowledge base**: 38 house rules learned the hard way, a formats table, and a ship checklist.
- **A starter kit**: Remotion + three.js with camera rigs, lighting rigs, effects, text, grain, a tank model and an example hero shot.
- **The myth studio kit** (new): the blue grid studio, the caption component, a rigged man with 45 motion clips retargeted in code, breathing, blinks, a recoil spring, IK hand grips, staggered finger release, trails, dust, and a worked example scene that renders as it ships.
- **Tools**: script lint for the myth format, no flash cuts (shots under 0.6 s), no clipped voice lines, a full sound check, final loudness, a sound-effect synthesiser and a quiet held-pad maker.

## Install (one step)

You need **Claude Code**, **Node.js 18+** and **ffmpeg**. Python 3.10+ is optional (tools).

1. Unzip the pack to a new folder, e.g. `my-reels/`.
2. Run the installer in that folder:
   - Windows: `powershell -ExecutionPolicy Bypass -File install.ps1`
   - macOS / Linux: `bash install.sh`

That's it. Open Claude Code in the folder (`cd my-reels && claude`).

Already have a project? Add the pack to it: `bash install.sh /path/to/project` (or `install.ps1 C:\path\to\project`). It copies `.claude/`, `knowledge/`, `kit/` and `tools/` in, and never overwrites an existing `CLAUDE.md` (it writes `CLAUDE.reel-pack.md` next to it for you to merge).

No installer? It's just files: copy the folder anywhere, then run `npm install` inside `kit/`.

## Make your first myth scene (5 minutes)

1. **See the example.** From `kit/`: `npx remotion render src/index.ts MythTwoBalls out/example.mp4`. Ten seconds, eleven shots: a man rolls one ball off a table and drops another beside it.
2. **Ask for your own.** In Claude Code, in the pack folder:
   > make a 10-second myth-style scene: a man drops a bowling ball and a feather. Which lands first?

   Claude reads the `myth-explainer` skill, writes the clause list and captions, copies the example scene, poses the man from the motion clips, checks still frames and renders `kit/out/<name>.mp4`.
3. **Look at it.** Ask for changes in plain words: "closer on the hand", "slow the fall", "make his shirt green".
4. **Go bigger.** "Write and build a full myth-explainer reel about whether a coin dropped from a skyscraper is dangerous." Claude picks the idea apart, writes the five-move script, lints it, plans about twenty shots, and stops for your OK before it builds.

## Make a hero shot (the v1 path)

> make a 6-second 9:16 animation of a tank firing, using the reel pack

Claude reads `reel-studio`, writes a 6-line plan, copies the example scene, uses the kit's tank model, checks stills and renders. Then: "run the checks and the first-time viewer on it", or "make a 40-second mechanism-reveal reel about how a lock works, full crew".

Tips:
- Preview while you work: `cd kit && npm run studio` opens Remotion Studio in your browser with a scrubber.
- Drafts fast: ask for a half-scale, single-sample draft render first.
- Everything is code: ask Claude to change any number, colour or move and re-render only that scene.
- Voice: the pack does not include a voice. Drafts work with captions alone or any free local text-to-speech; a paid voice is your choice.

## Folder map
```
CLAUDE.md                project instructions Claude Code loads automatically
.claude/skills/          the skills
.claude/agents/          the crew
knowledge/               house-rules.md, formats.md, checklist.md
kit/                     Remotion + three.js starter
  src/scenes/            HeroShot.tsx, MythTwoBalls.tsx (examples to copy)
  src/lib/               camera, lighting, fx, overlays, models/Tank
  src/lib/myth/          studio, man, motion maths, fx, MythStage, MythCaptions
  public/myth/           the man: model, textures, 45 motion clips (CC0)
tools/                   myth_script_lint.py, check_flash_cuts.py, check_line_tails.py, sound_check.py,
                         finish_audio.py, make_sfx.py, make_pad.py
projects/                one folder per video (notes, scripts, boards, renders)
```

## Troubleshooting
- **Render is black or fails with a WebGL error**: the kit uses the `angle` GL backend. On a Linux machine without a GPU, render with `--gl=swangle`.
- **`npx remotion` downloads a browser on first run**: that's normal (Chrome Headless Shell, about 100 MB, once).
- **Slow renders**: hero-shot scenes render at roughly 1-3 frames a second on a laptop; myth scenes are faster. Draft with `--scale=0.5` and, for myth scenes, `--props='{"samples":1}'`.
- **Python tools fail to import**: `pip install -r tools/requirements.txt`. The word check in `sound_check.py` downloads a speech model the first time.

## Licences
The pack's own files are MIT (see `LICENSE`). The man's model, textures and motion clips are by Quaternius, CC0 (public domain). `cinematic-director` is MIT by its author (see its own `LICENSE`). npm packages are installed from npm under their own licences; note that **Remotion has its own licence**: free for individuals and small companies, a company licence is required for larger companies (see remotion.dev/license). Details in `THIRD-PARTY-NOTICES.md`.
