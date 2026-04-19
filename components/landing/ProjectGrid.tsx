"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { projectHref } from "@/components/routes";
import type { ProjectRow } from "@/lib/queries/projects";
import { cn } from "@/lib/cn";

interface ProjectGridProps {
  projects: ProjectRow[];
}

/**
 * Responsive card grid for the landing page's project list. Each card
 * lazily loads a thumbnail of the project's latest render; on 404 (no
 * render yet or extraction failed) it falls back to a typographic
 * placeholder.
 */
export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectCard project={p} />
        </li>
      ))}
    </ul>
  );
}

function ProjectCard({ project }: { project: ProjectRow }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const href = projectHref(project.id);
  const updated = new Date(project.updated_at);

  return (
    <Link
      href={href}
      className="group flex flex-col border border-border bg-bg transition-colors hover:bg-bg-subtle"
      style={{ transitionDuration: "var(--dur-fast, 120ms)" }}
    >
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden border-b border-border bg-bg-subtle",
        )}
      >
        {thumbFailed ? (
          <Placeholder library={project.library} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/projects/${project.id}/thumbnail`}
            alt={`${project.title} thumbnail`}
            className="h-full w-full object-cover"
            onError={() => setThumbFailed(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="flex flex-1 items-start justify-between gap-3 px-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text-primary">{project.title}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge tone="neutral">{project.library}</Badge>
            <span className="text-xs text-text-tertiary">
              · {project.paradigm}
            </span>
          </div>
        </div>
        <Tooltip content={updated.toLocaleString()}>
          <time
            dateTime={updated.toISOString()}
            className="shrink-0 font-mono text-micro text-text-tertiary"
          >
            {formatRelative(project.updated_at)}
          </time>
        </Tooltip>
      </div>
    </Link>
  );
}

function Placeholder({ library }: { library: string }) {
  const initial = library[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg-subtle">
      <span className="font-mono text-display text-text-tertiary">
        {initial}
      </span>
    </div>
  );
}

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
