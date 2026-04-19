import { CommandTrigger } from "@/components/command/CommandTrigger";
import { LibraryReferencePanel } from "@/components/landing/LibraryReferencePanel";
import { ProjectGrid } from "@/components/landing/ProjectGrid";
import { PromptForm } from "@/components/landing/PromptForm";
import { Empty } from "@/components/ui/Empty";
import { Label } from "@/components/ui/Label";
import { listProjects } from "@/lib/queries/projects";

export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();

  return (
    <main className="mx-auto max-w-6xl px-8 py-12">
      <header className="flex items-start justify-between gap-4 border-b border-border pb-8">
        <div>
          <Label>ai-video-router · v0.1</Label>
          <h1 className="mt-3 font-sans text-display font-semibold tracking-tight text-text-primary">
            Describe a video.
          </h1>
          <p className="mt-3 max-w-xl font-sans text-base text-text-secondary">
            Route the intent to the right code-based video library, scaffold
            it, then iterate with Claude Code.
          </p>
        </div>
        <CommandTrigger className="mt-1 shrink-0" />
      </header>

      <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <Label index={1} className="mb-3 block">
            prompt
          </Label>
          <PromptForm />
        </div>
        <aside className="min-w-0">
          <Label index={2} className="mb-3 block">
            libraries
          </Label>
          <LibraryReferencePanel />
        </aside>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <div className="mb-4 flex items-center justify-between">
          <Label index={3}>projects</Label>
          <span className="font-mono text-micro text-text-tertiary">
            {projects.length}
          </span>
        </div>
        {projects.length === 0 ? (
          <Empty
            title="No projects yet"
            description="Describe a video above to create your first project."
          />
        ) : (
          <ProjectGrid projects={projects} />
        )}
      </section>
    </main>
  );
}
