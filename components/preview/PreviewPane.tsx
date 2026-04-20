"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { AsciiStatus } from "@/components/ui/AsciiStatus";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { CommandTrigger } from "@/components/command/CommandTrigger";
import { PaneHeader } from "@/components/project/PaneHeader";

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

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const statusTone =
    state.status === "running"
      ? "success"
      : state.status === "error"
        ? "danger"
        : state.status === "loading"
          ? "accent"
          : "idle";
  const statusLabel =
    state.status === "running"
      ? "ok"
      : state.status === "error"
        ? "!!"
        : state.status === "loading"
          ? "…"
          : "idle";

  return (
    <div className="flex h-full flex-col">
      <PaneHeader
        index={2}
        label="Preview"
        action={
          <>
            {state.status === "running" ? (
              <>
                <ButtonLink href={state.url} target="_blank" rel="noreferrer">
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
            <CommandTrigger />
          </>
        }
      >
        <AsciiStatus tone={statusTone}>{statusLabel}</AsciiStatus>
        {state.status === "running" && (
          <Tooltip content={state.url}>
            <span className="max-w-[320px] truncate font-mono text-[11px] text-ink">
              {state.url}
            </span>
          </Tooltip>
        )}
      </PaneHeader>
      <div className="relative min-h-0 flex-1 bg-surface-subtle">
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
          <p className="flex h-full items-center justify-center text-sm text-ink">
            Preview is not running.
          </p>
        )}
        {state.status === "loading" && (
          <p className="flex h-full items-center justify-center gap-2 text-sm text-ink">
            <Spinner size={12} label="Starting preview" />
            Starting preview…
          </p>
        )}
      </div>
    </div>
  );
}
