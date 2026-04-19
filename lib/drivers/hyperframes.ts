import path from "node:path";
import {
  findFreePort,
  runToCompletion,
  spawnPreview,
  spawnRender,
} from "./_process";
import type { VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "hyperframes");

export const hyperframesDriver: VideoDriver = {
  key: "hyperframes",
  paradigm: "html",
  label: "Hyperframes",
  templateDir: TEMPLATE_DIR,
  capabilities: { render: true, preview: true },

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(projectPath) {
    const port = await findFreePort();
    return spawnPreview({
      cmd: "pnpm",
      args: [
        "exec",
        "hyperframes",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      cwd: projectPath,
      url: `http://localhost:${port}`,
      readyRe: /server ready|listening on|preview available/i,
    });
  },

  render(projectPath, outPath, opts) {
    return spawnRender({
      cmd: "pnpm",
      args: ["exec", "hyperframes", "render", "--out", outPath],
      cwd: projectPath,
      outPath,
      errorLabel: "hyperframes render",
      progressRe: /frame\s+(\d+)\s*\/\s*(\d+)/i,
      signal: opts?.signal,
    });
  },
};
