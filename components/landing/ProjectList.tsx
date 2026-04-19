import type { Route } from "next";
import Link from "next/link";
import { listProjects } from "@/lib/queries/projects";

export function ProjectList() {
  const projects = listProjects();
  if (projects.length === 0) {
    return (
      <p className="border border-dashed border-line px-4 py-6 text-center text-sm text-ink-faint">
        No projects yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line border border-line">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`/projects/${p.id}` as Route}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-surface-subtle"
          >
            <div className="min-w-0">
              <p className="truncate text-ink">{p.title}</p>
              <p className="truncate text-xs text-ink-muted">
                {p.library} · {p.paradigm}
              </p>
            </div>
            <time
              className="shrink-0 text-xs text-ink-faint"
              dateTime={new Date(p.updated_at).toISOString()}
            >
              {formatRelative(p.updated_at)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
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
