import { spawn } from "node:child_process";
import path from "node:path";
import {
  buildChildEnv,
  findFreePort,
  killTree,
  runToCompletion,
  waitForReady,
} from "./_process";
import type { PreviewHandle, VideoDriver } from "./types";

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

  async startPreview(projectPath): Promise<PreviewHandle> {
    const port = await findFreePort();
    const proc = spawn(
      "pnpm",
      ["exec", "vite", "--port", String(port), "--host", "127.0.0.1"],
      {
        cwd: projectPath,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: buildChildEnv(),
      },
    );
    try {
      await waitForReady(proc, (text) => /localhost:|ready in/i.test(text));
    } catch (err) {
      await killTree(proc);
      throw err;
    }
    return {
      url: `http://127.0.0.1:${port}`,
      kill: async () => {
        await killTree(proc);
      },
    };
  },

  render() {
    throw new Error("render not supported");
  },
};
