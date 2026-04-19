"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (deleting) return;
    if (!confirm("Delete this project from the database? Scaffolded files on disk stay under ~/.ai-video-router/projects/.")) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
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

  return (
    <div className="border-t border-line px-3 py-3 text-xs">
      <button
        type="button"
        onClick={() => void onDelete()}
        disabled={deleting}
        className="w-full border border-danger/40 bg-surface px-2 py-1 text-danger hover:bg-[color:var(--color-danger)]/5 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete project"}
      </button>
      {error && (
        <p className="mt-2 text-danger">{error}</p>
      )}
    </div>
  );
}
