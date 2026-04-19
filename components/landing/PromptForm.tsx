"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/**
 * Build a typed href for the project workspace route.
 * Next 16 typed routes narrow `Route` to a union of static path strings;
 * the template literal has to be reasserted once, in one place.
 */
function projectHref(id: string): Route {
  return `/projects/${id}` as Route;
}

type Phase = "idle" | "classifying" | "scaffolding";

interface Classification {
  title: string;
  library: string;
  paradigm: string;
  confidence: number;
  rationale: string;
  spec: {
    durationSec: number;
    fps: number;
    dimensions: string;
    tone: string;
    hasAvatar: boolean;
    hasDataViz: boolean;
  };
}

export function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [classification, setClassification] = useState<Classification | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function classify(e: React.FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || phase !== "idle") return;
    setError(null);
    setClassification(null);
    setPhase("classifying");
    try {
      const res = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        body: JSON.stringify({ prompt: text }),
      });
      const data: { classification?: Classification; error?: string } =
        await res.json();
      if (!res.ok || !data.classification) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setClassification(data.classification);
      setPhase("idle");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  async function scaffold() {
    if (!classification) return;
    setPhase("scaffolding");
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        body: JSON.stringify({
          title: classification.title,
          prompt: prompt.trim(),
          library: classification.library,
          paradigm: classification.paradigm,
        }),
      });
      const data: { project?: { id: string }; error?: string } =
        await res.json();
      if (!res.ok || !data.project) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      router.push(projectHref(data.project.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  return (
    <form
      onSubmit={classify}
      className="border border-line bg-surface p-5 text-sm"
    >
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">
          describe the video
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          disabled={phase !== "idle"}
          className="mt-1 w-full resize-y border border-line bg-surface px-2 py-1 text-ink focus:border-accent disabled:opacity-60"
          placeholder="30s product explainer, corporate tone, kinetic title, neutral palette…"
        />
      </label>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-ink-muted">
          Cerebras/Groq Llama 3.3 routes to the best library.
        </p>
        {!classification && (
          <Button
            type="submit"
            variant="primary"
            disabled={phase !== "idle" || !prompt.trim()}
          >
            {phase === "classifying" ? "Routing…" : "Route"}
          </Button>
        )}
      </div>

      {classification && (
        <ClassificationPreview
          classification={classification}
          onConfirm={scaffold}
          onCancel={() => setClassification(null)}
          submitting={phase === "scaffolding"}
        />
      )}

      {error && (
        <div className="mt-3">
          <Alert variant="danger" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
    </form>
  );
}

function ClassificationPreview({
  classification,
  onConfirm,
  onCancel,
  submitting,
}: {
  classification: Classification;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="mt-4 border border-line bg-surface-subtle p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">
        classification
      </p>
      <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-ink-muted">
        <span className="text-ink-faint">title</span>
        <span className="text-ink">{classification.title}</span>
        <span className="text-ink-faint">library</span>
        <span className="text-ink">
          {classification.library}{" "}
          <span className="text-ink-faint">· {classification.paradigm}</span>
        </span>
        <span className="text-ink-faint">confidence</span>
        <span className="text-ink">
          {(classification.confidence * 100).toFixed(0)}%
        </span>
        <span className="text-ink-faint">duration</span>
        <span className="text-ink">
          {classification.spec.durationSec}s @ {classification.spec.fps}fps
        </span>
        <span className="text-ink-faint">dimensions</span>
        <span className="text-ink">{classification.spec.dimensions}</span>
        <span className="text-ink-faint">tone</span>
        <span className="text-ink">{classification.spec.tone}</span>
      </div>
      <p className="mt-2 border-t border-line pt-2 text-xs italic text-ink-muted">
        {classification.rationale}
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button onClick={onCancel} disabled={submitting}>
          Re-route
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Scaffolding…" : "Scaffold project"}
        </Button>
      </div>
    </div>
  );
}
