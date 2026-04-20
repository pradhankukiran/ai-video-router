"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

const CONFIRM_WINDOW_MS = 5000;

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  async function confirmDelete() {
    setDeleting(true);
    setArmed(false);
    clearTimer();
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  function onClick() {
    if (deleting) return;
    if (armed) {
      void confirmDelete();
      return;
    }
    setArmed(true);
    clearTimer();
    timerRef.current = setTimeout(() => {
      setArmed(false);
      timerRef.current = null;
    }, CONFIRM_WINDOW_MS);
  }

  const label = deleting
    ? "Deleting…"
    : armed
      ? "Click again to confirm"
      : "Delete project";

  const announcement = deleting
    ? "Deleting project"
    : armed
      ? "Delete armed, click again to confirm. Auto-disarms in 5 seconds."
      : "";

  return (
    <div className="border-t-2 border-ink px-3 py-3 text-xs">
      <Button
        variant="danger"
        onClick={onClick}
        disabled={deleting}
        className="w-full"
      >
        {label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      {armed && !deleting && (
        <p className="mt-1 text-ink-faint">
          Scaffolded files on disk stay under ~/.ai-video-router/projects/.
        </p>
      )}
      {error && (
        <div className="mt-2">
          <Alert variant="danger" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
    </div>
  );
}
