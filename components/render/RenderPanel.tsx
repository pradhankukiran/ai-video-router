"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseSseStream } from "@/lib/sse";
import { Alert } from "@/components/ui/Alert";

interface RenderRow {
  id: string;
  kind: string;
  out_path: string | null;
  status: "running" | "done" | "error";
  started_at: number;
  finished_at: number | null;
  error: string | null;
}

type WireEvent =
  | { type: "start"; renderId: string; outPath: string }
  | { type: "progress"; frame: number; totalFrames: number }
  | { type: "log"; line: string }
  | { type: "done"; outPath: string }
  | { type: "error"; message: string }
  | { type: "settled"; status: "done" | "error"; renderId: string };

interface RenderProgress {
  frame: number;
  totalFrames: number;
  error: string | null;
  doneUrl: string | null;
}

export function RenderPanel({ projectId }: { projectId: string }) {
  const [renders, setRenders] = useState<RenderRow[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/render/${projectId}`);
    if (!res.ok) return;
    const data: { renders: RenderRow[] } = await res.json();
    setRenders(data.renders);
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const start = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setProgress({ frame: 0, totalFrames: 0, error: null, doneUrl: null });
    const controller = new AbortController();
    abortRef.current = controller;
    let settled = false;
    try {
      const res = await fetch(`/api/render/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setProgress({
          frame: 0,
          totalFrames: 0,
          error: `HTTP ${res.status}`,
          doneUrl: null,
        });
        settled = true;
        return;
      }
      for await (const ev of parseSseStream<WireEvent>(res.body)) {
        if (ev.type === "progress") {
          setProgress((p) =>
            p
              ? {
                  ...p,
                  frame: ev.frame,
                  totalFrames: ev.totalFrames || p.totalFrames,
                }
              : p,
          );
        } else if (ev.type === "error") {
          setProgress((p) =>
            p
              ? { ...p, error: ev.message }
              : { frame: 0, totalFrames: 0, error: ev.message, doneUrl: null },
          );
        } else if (ev.type === "settled") {
          settled = true;
          if (ev.status === "done") {
            setProgress((p) =>
              p
                ? { ...p, doneUrl: `/api/renders/${ev.renderId}/file` }
                : null,
            );
          }
        }
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        settled = true;
        setProgress((p) =>
          p ? { ...p, error: "Render cancelled" } : null,
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setProgress((p) =>
          p
            ? { ...p, error: message }
            : { frame: 0, totalFrames: 0, error: message, doneUrl: null },
        );
      }
    } finally {
      if (!settled) {
        setProgress((p) =>
          p
            ? { ...p, error: "Render stream ended unexpectedly" }
            : {
                frame: 0,
                totalFrames: 0,
                error: "Render stream ended unexpectedly",
                doneUrl: null,
              },
        );
      }
      abortRef.current = null;
      setRunning(false);
      await refresh();
    }
  }, [projectId, running, refresh]);

  return (
    <div className="flex flex-col text-sm">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">
          render
        </p>
        {running ? (
          <button
            type="button"
            onClick={cancel}
            className="border border-line bg-surface px-3 py-1 text-xs text-ink hover:bg-surface-subtle"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void start()}
            className="border border-accent bg-accent px-3 py-1 text-xs text-accent-ink"
          >
            Render MP4
          </button>
        )}
      </div>

      {progress && (
        <div className="border-b border-line px-3 py-2 text-xs">
          {progress.totalFrames > 0 && (
            <div className="mb-1 flex items-center justify-between text-ink-muted">
              <span>
                {progress.frame}/{progress.totalFrames} frames
              </span>
              <span>
                {Math.round((progress.frame / progress.totalFrames) * 100)}%
              </span>
            </div>
          )}
          {progress.totalFrames > 0 && (
            <div
              role="progressbar"
              aria-valuenow={progress.frame}
              aria-valuemin={0}
              aria-valuemax={progress.totalFrames}
              aria-label="Render progress"
              className="h-1.5 w-full bg-surface-subtle"
            >
              <div
                className="h-1.5 bg-accent"
                style={{
                  width: `${Math.min(100, (progress.frame / progress.totalFrames) * 100)}%`,
                }}
              />
            </div>
          )}
          {progress.error && (
            <div className="mt-1">
              <Alert variant="danger">{progress.error}</Alert>
            </div>
          )}
          {progress.doneUrl && (
            <p className="mt-1 text-success">
              Done.{" "}
              <a
                href={progress.doneUrl}
                className="underline"
                rel="noreferrer"
              >
                Download
              </a>
            </p>
          )}
        </div>
      )}

      <ul className="divide-y divide-line">
        {renders.length === 0 ? (
          <li className="px-3 py-3 text-xs text-ink-faint">No renders yet.</li>
        ) : (
          renders.map((r) => <RenderRowItem key={r.id} render={r} />)
        )}
      </ul>
    </div>
  );
}

function RenderRowItem({ render }: { render: RenderRow }) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
      <div className="min-w-0">
        <p className="truncate text-ink">
          {new Date(render.started_at).toLocaleString()}
        </p>
        <p className="truncate text-ink-faint">
          {render.status}
          {render.error ? ` · ${render.error}` : null}
        </p>
      </div>
      {render.status === "done" ? (
        <a
          href={`/api/renders/${render.id}/file`}
          className="shrink-0 border border-line bg-surface px-2 py-1 text-ink hover:bg-surface-subtle"
          rel="noreferrer"
        >
          Download
        </a>
      ) : null}
    </li>
  );
}
