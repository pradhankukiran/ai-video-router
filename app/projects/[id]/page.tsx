import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PaneHeader } from "@/components/project/PaneHeader";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { WorkspaceSidebar } from "@/components/project/WorkspaceSidebar";
import { Badge } from "@/components/ui/Badge";
import { getProject } from "@/lib/queries/projects";
import { listMessages, rowsToEntries } from "@/lib/queries/messages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectWorkspace({ params }: Props) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const initialEntries = rowsToEntries(listMessages(project.id));

  const initialPrompt =
    project.session_id || initialEntries.length > 0
      ? null
      : `${project.prompt}\n\nThis is a fresh ${project.library} project scaffold with placeholder text. Read the README to understand the structure, then edit the source so the video matches the description above.`;

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_320px] divide-x-2 divide-ink">
      <section className="flex min-h-0 flex-col">
        <PaneHeader index={1} label="Chat">
          <span className="truncate text-sm font-semibold text-ink">
            {project.title}
          </span>
          <Badge tone="accent">{project.library}</Badge>
        </PaneHeader>
        <div className="min-h-0 flex-1">
          <ChatPanel
            projectId={project.id}
            initialPrompt={initialPrompt}
            initialEntries={initialEntries}
          />
        </div>
      </section>

      <section className="flex min-h-0 flex-col">
        <PreviewPane projectId={project.id} />
      </section>

      <aside className="flex min-h-0 flex-col">
        <WorkspaceSidebar project={project} />
      </aside>
    </div>
  );
}
