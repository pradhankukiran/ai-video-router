import path from "node:path";
import {
  findFreePort,
  runToCompletion,
  spawnPreview,
  spawnRender,
} from "./_process";
import type { VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "revideo");

export const revideoDriver: VideoDriver = {
  key: "revideo",
  paradigm: "generator",
  label: "Revideo",
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
        "revideo",
        "serve",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      cwd: projectPath,
      url: `http://127.0.0.1:${port}`,
      readyRe: /ready in|server running/i,
    });
  },

  render(projectPath, outPath, opts) {
    return spawnRender({
      cmd: "pnpm",
      args: ["exec", "revideo", "render", "--output", outPath],
      cwd: projectPath,
      outPath,
      errorLabel: "revideo render",
      progressRe: /frame\s+(\d+)\s*\/\s*(\d+)/i,
      signal: opts?.signal,
    });
  },
};
