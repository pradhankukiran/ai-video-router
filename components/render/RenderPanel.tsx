"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseSseStream } from "@/lib/sse";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

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
  info: string | null;
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

  // Abort any in-flight render stream on unmount so a route change doesn't
  // leak server-side SSE handlers.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const start = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setProgress({
      frame: 0,
      totalFrames: 0,
      error: null,
      info: null,
      doneUrl: null,
    });
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
          info: null,
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
              : {
                  frame: 0,
                  totalFrames: 0,
                  error: ev.message,
                  info: null,
                  doneUrl: null,
                },
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
          p ? { ...p, info: "Render cancelled" } : null,
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setProgress((p) =>
          p
            ? { ...p, error: message }
            : {
                frame: 0,
                totalFrames: 0,
                error: message,
                info: null,
                doneUrl: null,
              },
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
                info: null,
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
      <div className="flex items-center justify-between border-b-2 border-ink px-3 py-2">
        <Label>render</Label>
        {running ? (
          <Button onClick={cancel}>Cancel</Button>
        ) : (
          <Button variant="primary" onClick={() => void start()}>
            Render MP4
          </Button>
        )}
      </div>

      {progress && (
        <div className="border-b-2 border-ink px-3 py-2 text-xs">
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
              className="h-3 w-full border-2 border-ink bg-surface"
            >
              <div
                className="h-full bg-[color:var(--color-vermilion)]"
                style={{
                  width: `${Math.min(100, (progress.frame / progress.totalFrames) * 100)}%`,
                }}
              />
            </div>
          )}
          {progress.error && (
            <div className="mt-1">
              <Alert
                variant="danger"
                onDismiss={() =>
                  setProgress((p) => (p ? { ...p, error: null } : p))
                }
              >
                {progress.error}
              </Alert>
            </div>
          )}
          {progress.info && (
            <div className="mt-1">
              <Alert
                variant="info"
                onDismiss={() =>
                  setProgress((p) => (p ? { ...p, info: null } : p))
                }
              >
                {progress.info}
              </Alert>
            </div>
          )}
          {progress.doneUrl && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-success">Done.</span>
              <ButtonLink
                href={progress.doneUrl}
                target="_blank"
                rel="noreferrer"
                download
              >
                Download
              </ButtonLink>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y-2 divide-ink">
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
        <ButtonLink
          href={`/api/renders/${render.id}/file`}
          target="_blank"
          rel="noreferrer"
          download
          className="shrink-0"
        >
          Download
        </ButtonLink>
      ) : null}
    </li>
  );
}
