"use client";

import { useState } from "react";
import { Label } from "@/components/ui/Label";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ProjectRow } from "@/lib/queries/projects";

export function ProjectMeta({ project }: { project: ProjectRow }) {
  return (
    <div className="flex flex-col text-sm">
      <section className="border-b-2 border-ink px-3 py-3">
        <Label index={1}>library</Label>
        <p className="mt-1 font-mono text-text-primary">{project.library}</p>
        <p className="mt-0.5 text-xs text-text-tertiary">{project.paradigm}</p>
      </section>

      <section className="border-b-2 border-ink px-3 py-3">
        <Label index={2}>title</Label>
        <p className="mt-1 whitespace-pre-wrap font-sans text-text-primary">
          {project.title}
        </p>
      </section>

      <section className="border-b-2 border-ink px-3 py-3">
        <Label index={3}>prompt</Label>
        <p className="mt-1 whitespace-pre-wrap font-sans text-text-secondary">
          {project.prompt}
        </p>
      </section>

      <section className="border-b-2 border-ink px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Label index={4}>project path</Label>
          <CopyButton text={project.path} />
        </div>
        <p className="mt-1 break-all font-mono text-xs text-text-secondary">
          {project.path}
        </p>
      </section>

      <section className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Label index={5}>session</Label>
          {project.session_id && <CopyButton text={project.session_id} />}
        </div>
        <p className="mt-1 break-all font-mono text-xs text-text-secondary">
          {project.session_id ?? "— not started —"}
        </p>
      </section>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* noop — clipboard permissions denied or document inactive */
    }
  }
  return (
    <Tooltip content={copied ? "copied" : "copy"}>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "copied" : "copy"}
        className="border-2 border-ink bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-[color:var(--color-accent-ink)]"
      >
        {copied ? "✓" : "copy"}
      </button>
    </Tooltip>
  );
}
