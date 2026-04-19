import path from "node:path";
import { buildChildEnv, runToCompletion, spawnRender } from "./_process";
import type { PreviewHandle, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "ffcreator");

export const ffcreatorDriver: VideoDriver = {
  key: "ffcreator",
  paradigm: "canvas-node",
  label: "FFCreator",
  templateDir: TEMPLATE_DIR,
  capabilities: { render: true, preview: false },

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(): Promise<PreviewHandle> {
    throw new Error("preview not supported");
  },

  render(projectPath, outPath, opts) {
    return spawnRender({
      cmd: "pnpm",
      args: ["run", "build"],
      cwd: projectPath,
      outPath,
      errorLabel: "ffcreator script",
      env: buildChildEnv({ AVR_OUTPUT_PATH: outPath }),
      progressRe: /progress\s+(\d+)%/i,
      progressFromMatch: (m) =>
        m[1] ? { frame: Number(m[1]), totalFrames: 100 } : null,
      signal: opts?.signal,
    });
  },
};
