import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CommandTrigger } from "@/components/command/CommandTrigger";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { WorkspaceSidebar } from "@/components/project/WorkspaceSidebar";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { getProject } from "@/lib/queries/projects";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectWorkspace({ params }: Props) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  // First-turn bootstrap: give Claude Code the user's original video
  // description plus just enough context to find its way around the
  // scaffold. Only sent on the very first workspace mount for a project
  // (detected via the absence of a session_id); resumed sessions skip it.
  const initialPrompt = project.session_id
    ? null
    : `${project.prompt}\n\nThis is a fresh ${project.library} project scaffold with placeholder text. Read the README to understand the structure, then edit the source so the video matches the description above.`;

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_320px] divide-x divide-border">
      <section className="flex min-h-0 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            <Label>project</Label>
            <h1 className="mt-0.5 flex items-center gap-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {project.title}
              </span>
              <Badge tone="neutral">{project.library}</Badge>
            </h1>
          </div>
          <CommandTrigger />
        </header>
        <div className="min-h-0 flex-1">
          <ChatPanel projectId={project.id} initialPrompt={initialPrompt} />
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
