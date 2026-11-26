import { Config } from "@remotion/cli/config";

// three.js needs a real GL context in headless Chrome. "angle" works on Windows, macOS and most Linux boxes.
// If a render comes out black on Linux without a GPU, try "swangle" (software, slower).
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
// WebGL scenes are heavy: two tabs is a safe default on a laptop. Raise it on a strong machine.
Config.setConcurrency(2);
