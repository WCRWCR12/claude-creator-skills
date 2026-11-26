import React from "react";

/**
 * Lighting rigs. Readable first, mood second: the subject must be clearly lit at phone size.
 * Warm key / cool fill / rim on the subject edge, plus haze (fog) so distance reads.
 */
export const GoldenHour: React.FC<{
  sky?: string;
  fogDensity?: number;
  keyIntensity?: number;
  sunDir?: [number, number, number];
}> = ({ sky = "#c9a27e", fogDensity = 0.012, keyIntensity = 3.2, sunDir = [-30, 22, -18] }) => (
  <>
    <color attach="background" args={[sky]} />
    <fogExp2 attach="fog" args={[sky, fogDensity]} />
    {/* sky/ground bounce = cool fill, about 20-30% of the key */}
    <hemisphereLight args={["#a9bedc", "#6a5238", 1.6]} />
    {/* small ambient floor so no face goes pure black at phone size */}
    <ambientLight intensity={0.35} color="#c8c2b8" />
    {/* warm key (low sun) with soft shadows */}
    <directionalLight
      position={sunDir}
      intensity={keyIntensity}
      color="#ffc88a"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-25}
      shadow-camera-right={25}
      shadow-camera-top={25}
      shadow-camera-bottom={-25}
      shadow-camera-near={1}
      shadow-camera-far={120}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
    />
    {/* rim from behind the subject so its edge separates from the background */}
    <directionalLight position={[20, 10, 30]} intensity={1.1} color="#ffe2c0" />
  </>
);

export const NightInterior: React.FC<{ bg?: string; fogDensity?: number }> = ({ bg = "#0d0f14", fogDensity = 0.04 }) => (
  <>
    <color attach="background" args={[bg]} />
    <fogExp2 attach="fog" args={[bg, fogDensity]} />
    <hemisphereLight args={["#3a4a66", "#120d08", 0.5]} />
    <directionalLight position={[4, 8, 6]} intensity={1.2} color="#9db4ff" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
  </>
);

/**
 * A practical light that flickers (candle, lamp, fire). Seeded and frame-locked.
 * Put it next to a visible source (a flame mesh, a bulb) so the light is motivated.
 */
export function flicker(frame: number, base = 2, depth = 0.35, seed = 1) {
  const t = frame / 30;
  const n = Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 7.3 + seed * 2.1) * 0.3 + Math.sin(t * 23.7 + seed * 0.7) * 0.2;
  return base * (1 + depth * n);
}
