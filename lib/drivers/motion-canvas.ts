import { spawn } from "node:child_process";
import path from "node:path";
import {
  findFreePort,
  makeEventStream,
  runToCompletion,
  waitForReady,
} from "./_process";
import type { PreviewHandle, RenderEvent, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "motion-canvas");

export const motionCanvasDriver: VideoDriver = {
  key: "motion-canvas",
  paradigm: "generator",
  label: "Motion Canvas",
  templateDir: TEMPLATE_DIR,

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(projectPath): Promise<PreviewHandle> {
    const port = await findFreePort();
    const proc = spawn(
      "pnpm",
      ["exec", "vite", "--port", String(port), "--host", "127.0.0.1"],
      { cwd: projectPath, stdio: ["ignore", "pipe", "pipe"] },
    );
    try {
      await waitForReady(proc, (text) => /localhost:|ready in/i.test(text));
    } catch (err) {
      proc.kill("SIGTERM");
      throw err;
    }
    return {
      url: `http://127.0.0.1:${port}`,
      kill: async () => {
        proc.kill("SIGTERM");
      },
    };
  },

  render(projectPath, outPath): AsyncIterable<RenderEvent> {
    const { push, end, stream } = makeEventStream<RenderEvent>();
    push({
      type: "error",
      message:
        "Motion Canvas render is v0.2 scope. Use the Studio UI's Render button for now, then ask Claude Code to copy the output to " +
        outPath +
        ".",
    });
    end();
    return stream;
  },
};
