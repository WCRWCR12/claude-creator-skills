# Graphics rules (house style for on-screen motion graphics)

How to plan motion graphics for talking-head reels. The planner (Claude) reads `<name>-words.json`
and writes `<name>-graphics.json`; the Remotion project draws it (one component per type in `Graphics.tsx`).
RULES.md is the cut/caption house style; this file is the graphics house style.

## The plan file

```json
{
  "face": {"x0": 28, "y0": 26, "x1": 76, "y1": 68},
  "events": [
    {"t_start": 1.20, "t_end": 2.60, "type": "keyword_slam", "props": {"text": "VIDEO GAME"}},
    {"t_start": 5.10, "t_end": 6.40, "type": "xp_pop", "props": {"text": "+10 XP"}}
  ]
}
```

- Times are seconds on the **new (cut) timeline**, i.e. the `t_start`/`t_end` of words in the words file.
  Start a graphic on the word it illustrates (or 1-3 frames before it), never after the word is gone.
- `face` = the face/head box in % of the frame. Default comes from `rules.json` `face_box`.
  Look at the frame grab and set it per clip if the speaker is framed differently.
- Overlays take `props.zone` (`top|left|right|lower`). SFX stay off unless the user asks for them.

## Zones (where graphics are allowed)

Computed from the face box, grown by the biggest punch-in (1.22x):

| zone  | where | use for |
|-------|-------|---------|
| `top`   | between the top 12% safe line and the top of the head | banners, bars, counters, callouts, slams, quest cards |
| `left`  | the wall to the left of the face | xp pops, icon pops |
| `right` | narrow strip right of the face, inside the right 12% line | small icon pops only |
| `lower` | between the caption band (72%) and the bottom 20% line | thin one-line callouts only, rarely |

Hard rules: never cover eyes or mouth; nothing in the top 12%, bottom 20% or right 12% (IG/TikTok UI);
nothing on top of the caption line at ~72%. `x`/`y` overrides (in % of frame) are clamped into the safe area.

## Vocabulary (fixed: only these types exist)

| type | what it looks like | props (defaults) | use when the speaker says... |
|------|--------------------|------------------|------------------------|
| `xp_pop` | green "+10 XP" pops and floats up, fades | `text` (str or list), `count` 1, `size` 60, `color`, `zone` left | they gain/earn/learn anything, "experience", "XP", small wins |
| `level_up` | gold "LEVEL UP!" banner, rotating rays, shine sweep | `text`, `sub` ("LIFE  LV 1 > LV 2") | a breakthrough, a reframe, "you become", the payoff line |
| `progress_bar` | HUD panel, bar fills from->to, number counts | `label` "XP", `from` .1, `to` .9, `max` 1000, `level`, `fill_seconds` 1.4 | progress, "every day", "over time", grinding, consistency |
| `counter` | big gold number counting up | `from` 0, `to` 100, `prefix` "$", `suffix`, `decimals`, `label`, `count_seconds` 1 | any number, money, %, years, reps |
| `callout` | dark card, accent bar, words reveal one by one | `text`, `sub`, `highlight` [words], `accent` | the key sentence of a section (2-6 words) |
| `keyword_slam` | one huge word slams down with shake + camera kick | `text`, `color` | the hook word, a shock word, the single most important word |
| `emoji_pop` | icon springs in, wobbles, pops out | `icon` (star coin trophy controller sword heart bolt check flame up brain) or `emoji`, `size`, `zone` left | a concrete noun (game, money, love, brain), an emotional beat |
| `quest_complete` | card flips in: check, "QUEST COMPLETE", title, reward chips | `title`, `rewards` ["+100 XP"], `header` | a story resolves, a lesson lands |
| `broll` | full-screen or split (top half) insert from `edit/broll/` | `file`, `mode` full/split, `want` (what clip would go here) | they describe something visual. No file -> skipped and listed as a slot to fill |
| `zoom` | smooth push-in on the video (eased in/out) | `to` 1.15, `in` .35, `out` .3, `hold_out` false | emotional peaks, the hook, the CTA; layer it under a slam/level_up |

Durations: pops 1.0-1.5 s, slams 0.8-1.4 s, callouts/cards/banners 1.5-2.5 s, bars/counters 1.8-2.6 s, zoom 1-3 s.
Motion: every entrance is a spring (overshoot, then settle), never linear or CSS easing.

## Density and pacing

1. Roughly **one graphic event every 2-4 s**. Warn on gaps over 4.5 s.
2. Max **one top-zone overlay at a time**; a left-zone pop can run alongside it.
3. Open strong: a `keyword_slam` or `callout` + `zoom` inside the first 1.5 s (the hook).
4. Match the topic. Game/XP talk -> game vocabulary (xp_pop, level_up, progress_bar, quest_complete).
   Money/numbers -> counter. Key points -> callout/keyword_slam. No XP pops on a money video.
5. Don't repeat the same type back-to-back more than twice; vary top and left zones.
6. Text on graphics is SHORT (1-6 words) and in the speaker's own words. Uppercase is fine on graphics;
   captions stay lowercase.
7. Leave the last 1.5 s (CTA) mostly clean: at most one small graphic.
8. B-roll: the user drops clips into `edit/broll/` and you reference them by file name. If there are none,
   still plan `broll` events where a cutaway would help (`want` says what to film or find); the render skips
   them and lists the slots.

## Originality

All graphics and icons are original: generic gaming-HUD style, open-licence Google fonts (Bungee, Anton,
Montserrat), hand-drawn SVG icons. Never add game logos, sprites, fonts, screenshots or trademarked artwork,
and never download copyrighted audio.

## Checking a render

Export one still per graphic. Read them: graphic visible and readable, off the face, inside the safe zones,
not on the caption line. Fix the plan (zone, text length, timing) and re-render until all pass.

## Accuracy
- Never put a number, price or currency on screen that the speaker didn't say. "A few hundred quid" stays
  words, not "£300"; "45 billion" without a currency stays "45 billion". No invented "99+".
- Keep keyword slams short (about 7 characters if the word is mostly wide letters like M, W, O) so they
  never touch the frame edges; use a callout for longer phrases.

## Teaching log (notes on graphics, newest first)
| date | what was said | what changed |
|------|----------------|--------------|
| (example) | "wants things on screen and moving, matched to what I say" | graphics stage created (this file + Remotion components) |
