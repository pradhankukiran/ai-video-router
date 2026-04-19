import { PromptForm } from "@/components/landing/PromptForm";
import { ProjectList } from "@/components/landing/ProjectList";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-16">
      <header className="border-b border-line pb-6">
        <p className="text-xs uppercase tracking-wider text-ink-faint">
          ai-video-router
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">
          Describe a video.
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Route the intent to the right code-based video library, scaffold it,
          then iterate with Claude Code.
        </p>
      </header>

      <section className="mt-8">
        <PromptForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-2 text-[10px] uppercase tracking-wider text-ink-faint">
          projects
        </h2>
        <ProjectList />
      </section>
    </main>
  );
}
