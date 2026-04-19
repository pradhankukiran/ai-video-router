import path from "node:path";
import { findFreePort, runToCompletion, spawnPreview } from "./_process";
import type { VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "motion-canvas");

export const motionCanvasDriver: VideoDriver = {
  key: "motion-canvas",
  paradigm: "generator",
  label: "Motion Canvas",
  templateDir: TEMPLATE_DIR,
  capabilities: { render: false, preview: true },

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(projectPath) {
    const port = await findFreePort();
    return spawnPreview({
      cmd: "pnpm",
      args: ["exec", "vite", "--port", String(port), "--host", "127.0.0.1"],
      cwd: projectPath,
      url: `http://127.0.0.1:${port}`,
      readyRe: /ready in/i,
    });
  },

  render() {
    throw new Error("render not supported");
  },
};
