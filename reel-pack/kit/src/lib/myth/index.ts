// The myth-explainer studio kit. See .claude/skills/myth-explainer/SKILL.md for the format and kit-guide.md for how to use this.
export * from "./math";
export { createStudio, cam, canvasTexture, V } from "./studio";
export type { Cam, FrameFn, Studio, StudioOptions } from "./studio";
export { loadMan, CLIPS } from "./man";
export type { Man, Pose, Side, Clip, ManOptions } from "./man";
export { makeTrail, setTrail, trailOf, makeDust, setDust, bounceY, fallTime, makeTable } from "./fx";
export { MythStage } from "./MythStage";
export { MythCaptions, paceChunks } from "./MythCaptions";
export type { Chunk } from "./MythCaptions";
