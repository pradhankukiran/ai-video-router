"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { PlayMark } from "@/components/ui/PlayMark";
import { Tooltip } from "@/components/ui/Tooltip";
import { projectHref } from "@/components/routes";
import type { ProjectRow } from "@/lib/queries/projects";
import { cn } from "@/lib/cn";

interface ProjectRowWithThumb extends ProjectRow {
  hasThumbnail?: boolean;
}

interface ProjectGridProps {
  projects: ProjectRowWithThumb[];
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

function ProjectCard({ project }: { project: ProjectRowWithThumb }) {
  // SSR-aware: if the server already knows there's no thumbnail on disk,
  // start in "failed" state so the designed Placeholder renders in the
  // first paint instead of flashing a broken <img>.
  const [thumbFailed, setThumbFailed] = useState(
    project.hasThumbnail === false,
  );
  const href = projectHref(project.id);
  const updated = new Date(project.updated_at);

  return (
    <Link
      href={href}
      className="group flex flex-col border-2 border-ink bg-surface transition-colors hover:bg-surface-subtle"
      style={{ transitionDuration: "var(--dur-fast, 120ms)" }}
    >
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden border-b-2 border-ink bg-surface-subtle",
        )}
      >
        {thumbFailed ? (
          <Placeholder
            library={project.library}
            paradigm={project.paradigm}
          />
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

/**
 * Swiss-poster designed card used when a project has no rendered
 * thumbnail yet. A big vermilion circle anchors the upper-right;
 * library name + paradigm sit bottom-left in Inter Black.
 */
function Placeholder({
  library,
  paradigm,
}: {
  library: string;
  paradigm: string;
}) {
  const libName = library.toUpperCase();
  // Shrink font size for long library names so they fit within the
  // 400-wide viewBox with a 20px left margin.
  const libFontSize =
    libName.length > 12 ? 28 : libName.length > 9 ? 34 : 42;
  return (
    <svg
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect width="400" height="225" fill="#ffffff" />
      {/* Nested play-button mark anchored top-right, partially cropped. */}
      <PlayMark cx={360} cy={55} r={78} />
      <g
        fill="#000000"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <text
          x="20"
          y="32"
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.5"
        >
          LIBRARY
        </text>
        <text
          x="20"
          y="178"
          fontSize={libFontSize}
          fontWeight="900"
          letterSpacing="-0.5"
        >
          {libName}
        </text>
        <text
          x="20"
          y="202"
          fontSize="11"
          fontWeight="600"
          letterSpacing="1.5"
        >
          {paradigm.toUpperCase()}
        </text>
      </g>
    </svg>
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
