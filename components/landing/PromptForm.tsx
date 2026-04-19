"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Pre-router landing form. Posts directly to /api/projects with a hardcoded
 * library (Remotion) until Phase 2 introduces the Cerebras classifier.
 */
export function PromptForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Untitled video");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled video",
          prompt: prompt.trim(),
          library: "remotion",
          paradigm: "react",
        }),
      });
      const data: { project?: { id: string }; error?: string } =
        await res.json();
      if (!res.ok || !data.project) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      router.push(`/projects/${data.project.id}` as Route);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border border-line bg-surface p-5 text-sm"
    >
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">
          title
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-line bg-surface px-2 py-1 text-ink focus:border-accent focus:outline-none"
          placeholder="e.g. Product explainer — 30s"
        />
      </label>
      <label className="mt-4 block">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">
          describe the video
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="mt-1 w-full resize-y border border-line bg-surface px-2 py-1 text-ink focus:border-accent focus:outline-none"
          placeholder="30s product explainer, corporate tone, kinetic title, neutral palette…"
        />
      </label>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-ink-muted">
          Pre-router: Remotion is hardcoded until Phase 2 lands.
        </p>
        <button
          type="submit"
          disabled={submitting || !prompt.trim()}
          className="border border-accent bg-accent px-4 py-1 text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Scaffolding…" : "Create project"}
        </button>
      </div>
      {error && (
        <p className="mt-3 border border-danger/30 bg-[color:var(--color-danger)]/5 px-2 py-1 text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
