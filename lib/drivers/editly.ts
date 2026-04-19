import path from "node:path";
import { runToCompletion, spawnRender } from "./_process";
import type { PreviewHandle, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "editly");

export const editlyDriver: VideoDriver = {
  key: "editly",
  paradigm: "json-node",
  label: "Editly",
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
      args: ["exec", "editly", "video.json5", "--out", outPath],
      cwd: projectPath,
      outPath,
      errorLabel: "editly",
      // Editly emits lines like "Clip 1/3 progress: 42%"; the driver reports
      // progress as a percentage against a 100-unit total.
      progressRe: /progress:\s*(\d+)%/i,
      progressFromMatch: (m) =>
        m[1] ? { frame: Number(m[1]), totalFrames: 100 } : null,
      signal: opts?.signal,
    });
  },
};
