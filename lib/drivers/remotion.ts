import path from "node:path";
import {
  findFreePort,
  runToCompletion,
  spawnPreview,
  spawnRender,
} from "./_process";
import type { VideoDriver } from "./types";

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

  async startPreview(projectPath) {
    const port = await findFreePort();
    return spawnPreview({
      cmd: "pnpm",
      args: [
        "exec",
        "remotion",
        "studio",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      cwd: projectPath,
      url: `http://localhost:${port}`,
      // Remotion Studio prints a concrete "Server ready" / "Studio is running
      // on" line once it's listening. Avoid matching incidental "localhost:"
      // mentions in deprecation warnings or dependency URLs.
      readyRe: /Server ready|Studio is running on/i,
    });
  },

  render(projectPath, outPath, opts) {
    // Remotion v4 CLI signature: `remotion render <entry> <composition> <out>`.
    // Pass the entry explicitly (matches the template scaffold) so we don't
    // depend on Remotion's default-entry discovery.
    return spawnRender({
      cmd: "pnpm",
      args: ["exec", "remotion", "render", "src/index.ts", "Main", outPath],
      cwd: projectPath,
      outPath,
      errorLabel: "remotion render",
      progressRe: /Rendering\s+\((\d+)\/(\d+)\)/i,
      signal: opts?.signal,
    });
  },
};
