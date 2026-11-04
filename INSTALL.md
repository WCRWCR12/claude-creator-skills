# Install instructions (for Claude)

The user has dragged this folder in and asked to install the skills. Do the following, then report back in a short list.

## 1. Copy the skills

Copy each of the 14 skill folders (every folder in this directory that contains a `SKILL.md`) into the user's personal skills folder:

- Mac / Linux: `~/.claude/skills/`
- Windows: `%USERPROFILE%\.claude\skills\`

Create the folder if it doesn't exist. Copy whole folders, including `scripts/`, `references/`, `assets/`, `evals/` and `LICENSE` files. If a skill with the same name is already installed, ask the user before replacing it. Don't copy `README.md` or `INSTALL.md`.

The 14 folders: `reel-cutter`, `caption-sync`, `instagram-edit`, `anti-slop-ai-video-editing`, `motion-graphics-render-loop`, `animation-ground-truth`, `reel-style`, `reel-formats-library`, `cinematic-director`, `hook-writer`, `caption-writer`, `hook-virality-check`, `video-contact-sheet`, `hook-flip-reel-scout`.

## 2. Check the free tools

Run each check and tell the user what's present and what's missing. Don't install anything without asking; show the install command and let them say yes.

| Tool | Check | Needed by | Install if missing |
|------|-------|-----------|--------------------|
| ffmpeg | `ffmpeg -version` | reel-cutter, caption-sync, instagram-edit, video-contact-sheet, hook-flip-reel-scout, hook-virality-check, motion-graphics-render-loop | Windows `winget install Gyan.FFmpeg`, Mac `brew install ffmpeg`, Linux `sudo apt install ffmpeg` |
| Python 3.9+ | `python --version` (or `python3`) | reel-cutter, caption-sync, instagram-edit, video-contact-sheet, hook-flip-reel-scout | python.org, or `winget install Python.Python.3.12` / `brew install python` |
| Python packages | `python -c "import faster_whisper, numpy, PIL"` | reel-cutter, caption-sync, instagram-edit, video-contact-sheet | `pip install faster-whisper numpy pillow` (the first run downloads a ~500 MB speech model) |
| yt-dlp | `python -m yt_dlp --version` | video-contact-sheet, hook-flip-reel-scout (only for studying reference videos) | `pip install yt-dlp` |
| Node 18+ | `node --version` | motion-graphics-render-loop, instagram-edit (graphics stage), animation-ground-truth | nodejs.org, or `winget install OpenJS.NodeJS.LTS` / `brew install node`. Remotion is set up per project with `npx create-video@latest`. |

The writing skills (hook-writer, caption-writer, reel-formats-library, anti-slop-ai-video-editing, cinematic-director, reel-style) need nothing installed.

## 3. Tell the user how to use each skill

Give them this list (one example prompt each):

| Skill | Try saying |
|-------|-----------|
| reel-cutter | "Cut the pauses and ums out of `raw.mp4`." |
| caption-sync | "Add word-by-word captions to `reel.mp4`." |
| instagram-edit | "Write me a 45-second reel script about [topic], then edit my clip when I've filmed it." |
| anti-slop-ai-video-editing | "Edit this reel and follow the anti-slop rules." |
| motion-graphics-render-loop | "Make a 20-second motion-graphics promo for [product] at 120 BPM." |
| animation-ground-truth | "Animate this script in the breakout-card style." |
| reel-style | "Plan the shots for a tool-explainer reel about [tool] in our reel style." |
| reel-formats-library | "Which reel format should I use to launch [product]? Give me the beat sheet." |
| cinematic-director | "Write a shot plan and video prompts for a 30-second moody product film." |
| hook-writer | "Give me hooks for a reel about [topic]." |
| caption-writer | "Write an Instagram caption for this reel that gets comments." |
| hook-virality-check | "I've got three versions of my opening. Which hook is strongest, and where do people drop off?" |
| video-contact-sheet | "Make a contact sheet and transcript of `reference.mp4` and tell me how it's edited." |
| hook-flip-reel-scout | "Find five verified reference reels in the fail-then-product format for a coffee brand." |

## 4. Finish

Tell the user the skills are installed (or which ones failed and why), which tools are missing, and that they may need to start a new chat for the skills to appear.
