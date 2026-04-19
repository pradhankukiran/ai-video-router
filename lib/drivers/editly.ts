import { spawn } from "node:child_process";
import path from "node:path";
import { makeEventStream, runToCompletion } from "./_process";
import type { PreviewHandle, RenderEvent, VideoDriver } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "editly");

export const editlyDriver: VideoDriver = {
  key: "editly",
  paradigm: "json-node",
  label: "Editly",
  templateDir: TEMPLATE_DIR,

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(_projectPath): Promise<PreviewHandle> {
    throw new Error(
      "Editly has no live preview. Use the Render button to see a frame-accurate MP4.",
    );
  },

  render(projectPath, outPath): AsyncIterable<RenderEvent> {
    const { push, end, stream } = makeEventStream<RenderEvent>();

    const proc = spawn(
      "pnpm",
      ["exec", "editly", "video.json5", "--out", outPath],
      { cwd: projectPath, stdio: ["ignore", "pipe", "pipe"] },
    );

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      push({ type: "log", line: text });
      // editly prints lines like "Clip 1/3 progress: 42%"
      const m = /progress:\s*(\d+)%/i.exec(text);
      if (m?.[1]) {
        const pct = Number(m[1]);
        push({ type: "progress", frame: pct, totalFrames: 100 });
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
          message: `editly exited with code ${code}`,
        });
      end();
    });

    return stream;
  },
};
