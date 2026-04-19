export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-24">
      <header className="border-b border-line pb-6">
        <p className="text-xs uppercase tracking-wider text-ink-faint">
          ai-video-router
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">
          Describe a video.
        </h1>
        <p className="mt-2 text-ink-muted">
          Route the intent to the right code-based video library, scaffold it, then iterate with Claude Code.
        </p>
      </header>
      <section className="mt-8 text-sm text-ink-muted">
        <p>
          v0.1 scaffolding. The prompt UI, router, and project workspace ship in
          subsequent commits.
        </p>
      </section>
    </main>
  );
}
