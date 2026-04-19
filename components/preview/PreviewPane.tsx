"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "running"; url: string }
  | { status: "error"; message: string };

export function PreviewPane({ projectId }: { projectId: string }) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/preview/${projectId}`);
    const data: { status: string; url?: string } = await res.json();
    if (data.status === "running" && data.url) {
      setState({ status: "running", url: data.url });
    } else {
      setState({ status: "idle" });
    }
  }, [projectId]);

  const start = useCallback(async () => {
    setState({ status: "loading" });
    const res = await fetch(`/api/preview/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-avr": "1" },
    });
    const data: { status: string; url?: string; error?: string } =
      await res.json();
    if (!res.ok || !data.url) {
      setState({
        status: "error",
        message: data.error ?? `HTTP ${res.status}`,
      });
      return;
    }
    setState({ status: "running", url: data.url });
  }, [projectId]);

  const stop = useCallback(async () => {
    await fetch(`/api/preview/${projectId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-avr": "1" },
    });
    await refresh();
  }, [projectId, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0 text-xs text-ink-muted">
          <span className="uppercase tracking-wider">Preview</span>
          {state.status === "running" && (
            <span className="ml-2 truncate text-ink-faint">{state.url}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {state.status === "running" ? (
            <>
              <a
                href={state.url}
                target="_blank"
                rel="noreferrer"
                className="border border-line bg-surface px-2 py-1 text-ink hover:bg-surface-subtle"
              >
                Open
              </a>
              <button
                type="button"
                onClick={() => void stop()}
                className="border border-line bg-surface px-2 py-1 text-ink hover:bg-surface-subtle"
              >
                Stop
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void start()}
              disabled={state.status === "loading"}
              className="border border-line bg-surface px-2 py-1 text-ink hover:bg-surface-subtle disabled:opacity-50"
            >
              {state.status === "loading" ? "Starting…" : "Start preview"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-surface-subtle">
        {state.status === "running" ? (
          <iframe
            src={state.url}
            className="h-full w-full border-0 bg-white"
            title="Preview"
          />
        ) : state.status === "error" ? (
          <div className="p-4">
            <Alert variant="danger">{state.message}</Alert>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-ink-faint">
            {state.status === "loading"
              ? "Starting preview…"
              : "Preview is not running."}
          </p>
        )}
      </div>
    </div>
  );
}
