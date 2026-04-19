import type { ProjectRow } from "@/lib/queries/projects";

export function ProjectMeta({ project }: { project: ProjectRow }) {
  return (
    <div className="flex flex-col border-line text-sm">
      <section className="border-b border-line px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">
          library
        </p>
        <p className="mt-1 text-ink">{project.library}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{project.paradigm}</p>
      </section>

      <section className="border-b border-line px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">
          title
        </p>
        <p className="mt-1 whitespace-pre-wrap text-ink">{project.title}</p>
      </section>

      <section className="border-b border-line px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">
          prompt
        </p>
        <p className="mt-1 whitespace-pre-wrap text-ink-muted">
          {project.prompt}
        </p>
      </section>

      <section className="border-b border-line px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">
          project path
        </p>
        <p className="mt-1 break-all font-mono text-[11px] text-ink-muted">
          {project.path}
        </p>
      </section>

      <section className="px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">
          session
        </p>
        <p className="mt-1 break-all font-mono text-[11px] text-ink-muted">
          {project.session_id ?? "— not started —"}
        </p>
      </section>
    </div>
  );
}
