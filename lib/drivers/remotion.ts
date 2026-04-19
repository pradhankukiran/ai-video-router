import { spawn } from "node:child_process";
import path from "node:path";
import {
  findFreePort,
  makeEventStream,
  runToCompletion,
  waitForReady,
} from "./_process";
import type { PreviewHandle, RenderEvent, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "remotion");

export const remotionDriver: VideoDriver = {
  key: "remotion",
  paradigm: "react",
  label: "Remotion",
  templateDir: TEMPLATE_DIR,
  capabilities: { render: true, preview: true },

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(projectPath): Promise<PreviewHandle> {
    const port = await findFreePort();
    const proc = spawn(
      "pnpm",
      ["exec", "remotion", "studio", "--port", String(port)],
      { cwd: projectPath, stdio: ["ignore", "pipe", "pipe"] },
    );

    try {
      await waitForReady(proc, (text) =>
        /server ready|open your browser|localhost:/i.test(text),
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
      ["exec", "remotion", "render", "Main", outPath],
      { cwd: projectPath, stdio: ["ignore", "pipe", "pipe"] },
    );

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      push({ type: "log", line: text });
      const m = /Rendering\s+\((\d+)\/(\d+)\)/i.exec(text);
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
      else push({ type: "error", message: `remotion render exited with code ${code}` });
      end();
    });

    return stream;
  },
};
