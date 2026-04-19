import { spawn } from "node:child_process";
import path from "node:path";
import {
  buildChildEnv,
  killTree,
  makeEventStream,
  runToCompletion,
} from "./_process";
import type { PreviewHandle, RenderEvent, VideoDriver } from "./types";

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

  render(projectPath, outPath, opts): AsyncIterable<RenderEvent> {
    const { push, end, stream } = makeEventStream<RenderEvent>();

    if (opts?.signal?.aborted) {
      push({ type: "error", message: "Aborted" });
      end();
      return stream;
    }

    const proc = spawn("pnpm", ["run", "build"], {
      cwd: projectPath,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      env: buildChildEnv({ AVR_OUTPUT_PATH: outPath }),
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

    const onAbort = () => {
      void killTree(proc);
    };
    opts?.signal?.addEventListener("abort", onAbort, { once: true });

    proc.on("error", (err) => {
      push({ type: "error", message: err.message });
      end();
    });

    proc.on("exit", (code) => {
      opts?.signal?.removeEventListener("abort", onAbort);
      if (opts?.signal?.aborted) {
        push({ type: "error", message: "Aborted" });
      } else if (code === 0) push({ type: "done", outPath });
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
