import { Composition } from "@diffusionstudio/core";

/**
 * Diffusion Studio is browser-native: you script the video against a canvas
 * with a live preview. Check https://diffusion.studio for the API reference —
 * the exact primitive names (text, shape, video, transition, etc.) may shift
 * across releases. Ask Claude Code to adjust if imports don't match.
 */

const composition = new Composition({
  width: 1920,
  height: 1080,
  fps: 30,
});

const canvas = document.getElementById("stage") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("#stage canvas not found");
}

composition.attach(canvas);

// TODO: add layers (text, video, audio, transitions). See the DS docs.
// Example sketch (pseudo-API, may need to be adapted):
//
//   await composition.add(new Text({ text: "Your title", font: "sans-serif" }));
//   await composition.seek(0);
