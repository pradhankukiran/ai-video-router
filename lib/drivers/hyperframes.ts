import { spawn } from "node:child_process";
import path from "node:path";
import {
  findFreePort,
  makeEventStream,
  runToCompletion,
  waitForReady,
} from "./_process";
import type { PreviewHandle, RenderEvent, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "hyperframes");

export const hyperframesDriver: VideoDriver = {
  key: "hyperframes",
  paradigm: "html",
  label: "Hyperframes",
  templateDir: TEMPLATE_DIR,

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(projectPath): Promise<PreviewHandle> {
    const port = await findFreePort();
    const proc = spawn(
      "pnpm",
      ["exec", "hyperframes", "preview", "--port", String(port)],
      { cwd: projectPath, stdio: ["ignore", "pipe", "pipe"] },
    );

    try {
      await waitForReady(proc, (text) =>
        /server ready|listening on|localhost:|preview available/i.test(text),
      );
    } catch (err) {
      proc.kill("SIGTERM");
      throw err;
    }

    return {
      url: `http://localhost:${port}`,
      kill: async () => {
        proc.kill("SIGTERM");
      },
    };
  },

  render(projectPath, outPath): AsyncIterable<RenderEvent> {
    const { push, end, stream } = makeEventStream<RenderEvent>();

    const proc = spawn(
      "pnpm",
      ["exec", "hyperframes", "render", "--out", outPath],
      { cwd: projectPath, stdio: ["ignore", "pipe", "pipe"] },
    );

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      push({ type: "log", line: text });
      const m = /frame\s+(\d+)\s*\/\s*(\d+)/i.exec(text);
      if (m?.[1] && m[2]) {
        push({
          type: "progress",
          frame: Number(m[1]),
          totalFrames: Number(m[2]),
        });
      }
    };

    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);

    proc.on("error", (err) => {
      push({ type: "error", message: err.message });
      end();
    });

    proc.on("exit", (code) => {
      if (code === 0) push({ type: "done", outPath });
      else
        push({
          type: "error",
          message: `hyperframes render exited with code ${code}`,
        });
      end();
    });

    return stream;
  },
};
