"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Spinner } from "@/components/ui/Spinner";
import { StatusDot } from "@/components/ui/StatusDot";
import { Tooltip } from "@/components/ui/Tooltip";

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "running"; url: string }
  | { status: "error"; message: string };

export function PreviewPane({ projectId }: { projectId: string }) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/preview/${projectId}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { status: string; url?: string } = await res.json();
      if (data.status === "running" && data.url) {
        setState({ status: "running", url: data.url });
      } else {
        setState({ status: "idle" });
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", message });
    }
  }, [projectId]);

  const start = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/preview/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        signal: controller.signal,
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
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", message });
    }
  }, [projectId]);

  const stop = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setState({ status: "loading" });
    try {
      await fetch(`/api/preview/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      throw err;
    }
    if (controller.signal.aborted) return;
    await refresh();
  }, [projectId, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Abort any in-flight fetch on unmount so a route change doesn't leak
  // server-side handlers.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <StatusDot
            tone={
              state.status === "running"
                ? "success"
                : state.status === "loading"
                  ? "accent"
                  : state.status === "error"
                    ? "danger"
                    : "idle"
            }
            pulse={state.status === "loading"}
          />
          <Label>preview</Label>
          <Badge
            tone={
              state.status === "running"
                ? "success"
                : state.status === "error"
                  ? "danger"
                  : "neutral"
            }
          >
            {state.status}
          </Badge>
          {state.status === "running" && (
            <Tooltip content={state.url}>
              <span className="ml-1 max-w-[280px] truncate font-mono text-micro text-text-tertiary">
                {state.url}
              </span>
            </Tooltip>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          {state.status === "running" ? (
            <>
              <ButtonLink
                href={state.url}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </ButtonLink>
              <Button onClick={() => void stop()}>Stop</Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => void start()}
              disabled={state.status === "loading"}
            >
              {state.status === "loading" ? (
                <span className="inline-flex items-center gap-1.5">
                  <Spinner size={10} label="Starting" />
                  Starting…
                </span>
              ) : (
                "Start preview"
              )}
            </Button>
          )}
        </div>
      </header>
      <div className="relative min-h-0 flex-1 bg-bg-subtle">
        {state.status === "running" && (
          <iframe
            src={state.url}
            className="h-full w-full border-0 bg-white"
            title="Preview"
          />
        )}
        {state.status === "error" && (
          <div className="space-y-3 p-4">
            <Alert variant="danger">{state.message}</Alert>
            <Button onClick={() => void refresh()}>Retry</Button>
          </div>
        )}
        {state.status === "idle" && (
          <p className="flex h-full items-center justify-center text-sm text-text-tertiary">
            Preview is not running.
          </p>
        )}
        {state.status === "loading" && (
          <p className="flex h-full items-center justify-center gap-2 text-sm text-text-secondary">
            <Spinner size={12} label="Starting preview" />
            Starting preview…
          </p>
        )}
      </div>
    </div>
  );
}
