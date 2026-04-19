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
      {
        cwd: projectPath,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: buildChildEnv(),
      },
    );

    try {
      // Remotion Studio prints a concrete "Server ready" / "Studio is
      // running on" line once it's listening. The previous pattern matched
      // any line containing "localhost:", which false-positives on
      // deprecation warnings and dependency URLs.
      await waitForReady(proc, (text) =>
        /Server ready|Studio is running on/i.test(text),
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

    // Remotion v4's CLI signature is `remotion render <entry> <composition>
    // <out>`. Pass the entry explicitly (`src/index.ts` matches our
    // template scaffold) so the command doesn't depend on Remotion's
    // default-entry discovery.
    const proc = spawn(
      "pnpm",
      ["exec", "remotion", "render", "src/index.ts", "Main", outPath],
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
          message: `remotion render exited with code ${code}`,
        });
      end();
    });

    return stream;
  },
};
