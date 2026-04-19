import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import net from "node:net";

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
    const proc = spawn(cmd, args, { stdio: "inherit", ...opts });
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
