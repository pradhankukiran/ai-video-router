import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import net from "node:net";
import type { PreviewHandle, RenderEvent } from "./types";

const KILL_FALLBACK_MS = 3000;

/**
 * Kill a detached child AND its descendants via its process group.
 *
 * Drivers spawn e.g. `pnpm exec remotion …` which forks a grandchild; a plain
 * `proc.kill("SIGTERM")` only signals `pnpm` and orphans the real tool. We
 * therefore spawn with `detached: true` (new process group) and target the
 * whole group with a negative pid. If the group is still alive after the
 * grace window we escalate to SIGKILL.
 */
export async function killTree(proc: ChildProcess): Promise<void> {
  if (proc.exitCode !== null || proc.signalCode !== null) return;
  const pid = proc.pid;
  if (typeof pid !== "number") return;

  const sendGroup = (signal: NodeJS.Signals) => {
    try {
      process.kill(-pid, signal);
    } catch {
      // Group may have already exited, or we didn't actually create one;
      // fall back to targeting the direct child.
      try {
        proc.kill(signal);
      } catch {
        /* already dead */
      }
    }
  };

  const exited = new Promise<void>((resolve) => {
    if (proc.exitCode !== null || proc.signalCode !== null) return resolve();
    proc.once("exit", () => resolve());
  });

  sendGroup("SIGTERM");

  const escalate = setTimeout(() => sendGroup("SIGKILL"), KILL_FALLBACK_MS);
  try {
    await exited;
  } finally {
    clearTimeout(escalate);
  }
}

/**
 * Build a minimal env for spawned children.
 *
 * Default behavior of Node's `spawn` inherits `process.env` wholesale, which
 * would leak API keys (ANTHROPIC_API_KEY, CEREBRAS_API_KEY, GROQ_API_KEY, …)
 * and arbitrary secrets into every driver subprocess. We ship a strict
 * allow-list instead, and defensively drop anything matching the secret
 * pattern even if it's one of the allow-listed keys. Callers can pass `extra`
 * for driver-specific vars (e.g. ffcreator's `AVR_OUTPUT_PATH`).
 */
export function buildChildEnv(
  extra?: Record<string, string>,
): NodeJS.ProcessEnv {
  const ALLOW = [
    "PATH",
    "HOME",
    "USER",
    "LANG",
    "LC_ALL",
    "NODE_ENV",
    "TERM",
    "TMPDIR",
  ] as const;
  const SECRET_RE = /API_KEY|TOKEN|SECRET/i;
  // Writable view — `NodeJS.ProcessEnv` declares NODE_ENV as readonly so we
  // build the mapping as a plain record and cast once at the end.
  const env: Record<string, string> = {};
  for (const k of ALLOW) {
    const v = process.env[k];
    if (typeof v === "string" && !SECRET_RE.test(k)) {
      env[k] = v;
    }
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (SECRET_RE.test(k)) continue;
      env[k] = v;
    }
  }
  return env as NodeJS.ProcessEnv;
}

export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const { port } = addr;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error("Could not allocate port")));
      }
    });
  });
}

export function runToCompletion(
  cmd: string,
  args: string[],
  opts: SpawnOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Default to the scrubbed child env so callers (in particular
    // driver `install()` which runs `pnpm install` + lifecycle scripts)
    // don't leak ANTHROPIC_API_KEY / CEREBRAS_API_KEY / GROQ_API_KEY
    // into third-party install hooks by inheriting `process.env`.
    const env = opts.env ?? buildChildEnv();
    const proc = spawn(cmd, args, { stdio: "inherit", ...opts, env });
    proc.on("error", reject);
    proc.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`)),
    );
  });
}

/**
 * Wait until `ready(chunk)` returns true on stdout/stderr data, or reject on
 * timeout / early process exit.
 *
 * After readiness is detected we leave a permanent discard listener on both
 * streams. Node's default pipe buffer is 64KB; if nothing is consuming the
 * child's stdout/stderr the child will block on write() and deadlock. Callers
 * that want the output should attach their own listener BEFORE awaiting
 * readiness, or replace the discard by re-attaching.
 */
export function waitForReady(
  proc: ChildProcess,
  ready: (chunk: string) => boolean,
  timeoutMs = 30_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Process did not report ready in time")),
      timeoutMs,
    );
    const discard = () => {
      /* keep the pipe flowing so the child doesn't block on write() */
    };
    const onData = (chunk: Buffer) => {
      if (ready(chunk.toString())) {
        cleanup();
        resolve();
      }
    };
    const onExit = (code: number | null) => {
      cleanup();
      reject(new Error(`Process exited with code ${code} before ready`));
    };
    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout?.off("data", onData);
      proc.stderr?.off("data", onData);
      proc.off("exit", onExit);
      proc.stdout?.on("data", discard);
      proc.stderr?.on("data", discard);
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    proc.on("exit", onExit);
  });
}

/**
 * Async iterator backed by an internal queue. Consumers `for await` over it;
 * producers call push() and end() as events arrive.
 */
export function makeEventStream<T>(): {
  push: (event: T) => void;
  end: () => void;
  stream: AsyncIterable<T>;
} {
  const queue: T[] = [];
  let waiters: Array<(value: IteratorResult<T>) => void> = [];
  let done = false;

  const push = (event: T) => {
    if (done) return;
    const w = waiters.shift();
    if (w) w({ value: event, done: false });
    else queue.push(event);
  };

  const end = () => {
    if (done) return;
    done = true;
    while (waiters.length > 0) {
      waiters.shift()!({ value: undefined, done: true });
    }
  };

  const stream: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<T>> {
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }
          if (done) return Promise.resolve({ value: undefined, done: true });
          return new Promise<IteratorResult<T>>((resolve) => {
            waiters.push(resolve);
          });
        },
      };
    },
  };

  return { push, end, stream };
}

/**
 * Spawn a library's preview dev server, wait for its ready marker, and return
 * a PreviewHandle. Encapsulates the detached + scrubbed-env + kill-on-timeout
 * ceremony that every driver's `startPreview` otherwise repeats verbatim.
 */
export async function spawnPreview(spec: {
  cmd: string;
  args: string[];
  cwd: string;
  url: string;
  readyRe: RegExp;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}): Promise<PreviewHandle> {
  const proc = spawn(spec.cmd, spec.args, {
    cwd: spec.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: spec.env ?? buildChildEnv(),
  });
  try {
    await waitForReady(
      proc,
      (text) => spec.readyRe.test(text),
      spec.timeoutMs,
    );
  } catch (err) {
    await killTree(proc);
    throw err;
  }
  return {
    url: spec.url,
    kill: async () => {
      await killTree(proc);
    },
  };
}

/**
 * Spawn a library's native renderer and translate its output into a
 * RenderEvent stream. Encapsulates the short-circuit-on-pre-abort, abort
 * signal plumbing, log/progress parsing, and done/error transitions that
 * every render-capable driver otherwise repeats.
 *
 * `progressRe` is applied to each log chunk; capture groups 1 and 2 default
 * to {frame, totalFrames}. Drivers with a non-standard shape (editly reports
 * a percentage) can override via `progressFromMatch`.
 */
export function spawnRender(spec: {
  cmd: string;
  args: string[];
  cwd: string;
  outPath: string;
  errorLabel: string;
  signal?: AbortSignal;
  env?: NodeJS.ProcessEnv;
  progressRe?: RegExp;
  progressFromMatch?: (
    m: RegExpExecArray,
  ) => { frame: number; totalFrames: number } | null;
}): AsyncIterable<RenderEvent> {
  const { push, end, stream } = makeEventStream<RenderEvent>();

  if (spec.signal?.aborted) {
    push({ type: "error", message: "Aborted" });
    end();
    return stream;
  }

  const proc = spawn(spec.cmd, spec.args, {
    cwd: spec.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: spec.env ?? buildChildEnv(),
  });

  const mapMatch =
    spec.progressFromMatch ??
    ((m: RegExpExecArray) => {
      if (m[1] && m[2]) {
        return { frame: Number(m[1]), totalFrames: Number(m[2]) };
      }
      return null;
    });

  const onData = (chunk: Buffer) => {
    const text = chunk.toString();
    push({ type: "log", line: text });
    if (spec.progressRe) {
      const m = spec.progressRe.exec(text);
      if (m) {
        const p = mapMatch(m);
        if (p) {
          push({
            type: "progress",
            frame: p.frame,
            totalFrames: p.totalFrames,
          });
        }
      }
    }
  };
  proc.stdout?.on("data", onData);
  proc.stderr?.on("data", onData);

  const onAbort = () => {
    void killTree(proc);
  };
  spec.signal?.addEventListener("abort", onAbort, { once: true });

  proc.on("error", (err) => {
    push({ type: "error", message: err.message });
    end();
  });

  proc.on("exit", (code) => {
    spec.signal?.removeEventListener("abort", onAbort);
    if (spec.signal?.aborted) {
      push({ type: "error", message: "Aborted" });
    } else if (code === 0) {
      push({ type: "done", outPath: spec.outPath });
    } else {
      push({
        type: "error",
        message: `${spec.errorLabel} exited with code ${code}`,
      });
    }
    end();
  });

  return stream;
}
