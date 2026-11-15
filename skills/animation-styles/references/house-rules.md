# House rules for building in any style

These apply to every style in the library. A style tells you what the picture looks like; these rules tell you how to make it good.

1. **Plan the beats without words first.** Split the script into beats (one idea each, about 1 to 2.5 seconds). For every beat, describe the picture in one plain sentence that explains the line on its own, with the sound off. If the picture only repeats the words as text, redo it.
2. **Build the scene in code.** Remotion (React) or HTML plus ffmpeg. No AI video, no AI image generation. It costs 0 credits and every frame is reproducible.
3. **Full frame rate, always.** Render at 30 or 60 fps with smooth interpolation. Never use stepped or choppy motion to fake a style. The one exception is a pixel-art style that specifies stepped sprite animation, and even then the camera and text move smoothly.
4. **Flat solid colours.** No gradients, no glows, no gradient cards, unless the style spec explicitly lists them as part of its texture.
5. **No decorative micro-text.** No fake HUD labels, eyebrow tags, style chips or filler captions. Every piece of text on screen must be real content the viewer needs.
6. **Camera moves through a built scene.** Objects live in a scene and the camera travels through it. Do not have drawn objects teleport or jump around the frame.
7. **Never clip a word.** If there is a voice-over, cut on whole sentences, keep 150 to 250 ms tails, and remove silence between sentences.
8. **One style per beat, deliberately.** You can mix styles, but change style only at a beat boundary and keep palette and type consistent inside a beat.
9. **Neutral sample content.** Use plain placeholders such as "3 hours saved a week" or "Meet [Product]" until the user supplies real copy. Never copy another creator's content, logos or footage; copy the look, not the contents.
10. **Check before you ship.** Render, then make a contact sheet (one frame per beat, plus the first and last frame) and compare it with the style spec: palette, type, layout, texture, motion. Fix the mismatches, then re-render. Do not call it done until it matches.
