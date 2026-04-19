import { spawn } from "node:child_process";
import path from "node:path";
import {
  buildChildEnv,
  findFreePort,
  killTree,
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
  capabilities: { render: true, preview: true },

  async install(projectPath) {
    await runToCompletion("pnpm", ["install"], { cwd: projectPath });
  },

  async startPreview(projectPath): Promise<PreviewHandle> {
    const port = await findFreePort();
    // Explicit --host 127.0.0.1 so the preview never binds 0.0.0.0.
    const proc = spawn(
      "pnpm",
      [
        "exec",
        "hyperframes",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        cwd: projectPath,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: buildChildEnv(),
      },
    );

    try {
      await waitForReady(proc, (text) =>
        /server ready|listening on|localhost:|preview available/i.test(text),
      );
    } catch (err) {
      await killTree(proc);
      throw err;
    }

    return {
      url: `http://localhost:${port}`,
      kill: async () => {
        await killTree(proc);
      },
    };
  },

  render(projectPath, outPath, opts): AsyncIterable<RenderEvent> {
    const { push, end, stream } = makeEventStream<RenderEvent>();

    if (opts?.signal?.aborted) {
      push({ type: "error", message: "Aborted" });
      end();
      return stream;
    }

    const proc = spawn(
      "pnpm",
      ["exec", "hyperframes", "render", "--out", outPath],
      {
        cwd: projectPath,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: buildChildEnv(),
      },
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
          message: `hyperframes render exited with code ${code}`,
        });
      end();
    });

    return stream;
  },
};
