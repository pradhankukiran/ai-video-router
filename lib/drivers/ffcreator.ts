import { spawn } from "node:child_process";
import path from "node:path";
import { makeEventStream, runToCompletion } from "./_process";
import type { PreviewHandle, RenderEvent, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "ffcreator");

export const ffcreatorDriver: VideoDriver = {
  key: "ffcreator",
  paradigm: "canvas-node",
  label: "FFCreator",
  templateDir: TEMPLATE_DIR,

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(_projectPath): Promise<PreviewHandle> {
    throw new Error(
      "FFCreator has no live preview. Use the Render button to produce an MP4.",
    );
  },

  render(projectPath, outPath): AsyncIterable<RenderEvent> {
    const { push, end, stream } = makeEventStream<RenderEvent>();

    const proc = spawn("node", ["index.js"], {
      cwd: projectPath,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, AVR_OUTPUT_PATH: outPath },
    });

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      push({ type: "log", line: text });
      const m = /progress\s+(\d+)%/i.exec(text);
      if (m?.[1]) {
        push({ type: "progress", frame: Number(m[1]), totalFrames: 100 });
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
          message: `ffcreator script exited with code ${code}`,
        });
      end();
    });

    return stream;
  },
};
