import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { ProjectMeta } from "@/components/project/ProjectMeta";
import { RenderPanel } from "@/components/render/RenderPanel";
import { getProject } from "@/lib/queries/projects";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectWorkspace({ params }: Props) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_280px] divide-x divide-line">
      <section className="flex min-h-0 flex-col">
        <header className="border-b border-line px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">
            project · {project.library}
          </p>
          <h1 className="truncate text-sm font-medium text-ink">
            {project.title}
          </h1>
        </header>
        <div className="min-h-0 flex-1">
          <ChatPanel projectId={project.id} />
        </div>
      </section>

      <section className="flex min-h-0 flex-col">
        <PreviewPane projectId={project.id} />
      </section>

      <aside className="flex min-h-0 flex-col divide-y divide-line">
        <header className="px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">
            project
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ProjectMeta project={project} />
          <RenderPanel projectId={project.id} />
        </div>
      </aside>
    </div>
  );
}
