import { CommandTrigger } from "@/components/command/CommandTrigger";
import { LibraryReferencePanel } from "@/components/landing/LibraryReferencePanel";
import { ProjectGrid } from "@/components/landing/ProjectGrid";
import { PromptForm } from "@/components/landing/PromptForm";
import { Empty } from "@/components/ui/Empty";
import { PlayMark } from "@/components/ui/PlayMark";
import { hasProjectThumbnail, listProjects } from "@/lib/queries/projects";

export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects().map((p) => ({
    ...p,
    hasThumbnail: hasProjectThumbnail(p.id),
  }));
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <main className="min-h-dvh bg-surface text-ink">
      {/* Top meta band — poster info strip */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-ink px-8 py-3">
        <div className="flex items-center gap-4 text-[10px] uppercase font-semibold tracking-[0.1em] text-ink">
          <span>ai-video-router</span>
          <span aria-hidden className="inline-block h-3 w-px bg-ink" />
          <span>v&nbsp;0.1</span>
          <span aria-hidden className="inline-block h-3 w-px bg-ink" />
          <time dateTime={today.toISOString()}>{dateLabel}</time>
        </div>
        <CommandTrigger />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1400px] px-8 pt-20 pb-24">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9 min-w-0">
            <h1
              className="font-black leading-[0.85] tracking-[-0.03em] text-ink"
              style={{ fontSize: "clamp(72px, 14vw, 180px)" }}
            >
              Describe
              <br />a video<span className="text-[color:var(--color-vermilion)]">.</span>
            </h1>
          </div>
          <div className="col-span-3 flex justify-end items-start pt-4">
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="block"
              style={{
                width: "clamp(180px, 22vw, 300px)",
                height: "clamp(180px, 22vw, 300px)",
              }}
            >
              <PlayMark cx={50} cy={50} r={50} />
            </svg>
          </div>
        </div>
        <p className="mt-12 max-w-xl text-lg leading-[1.5] text-ink">
          A tool for prompt-driven video generation. Route the intent to the
          right code-based video library, scaffold it, then iterate with Claude
          Code.
        </p>
      </section>

      {/* Module 01 / 02 — Prompt + Libraries */}
      <section className="border-t-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-8 min-w-0">
              <ModuleHeading index={1} label="Prompt" />
              <div className="mt-10">
                <PromptForm />
              </div>
            </div>
            <aside className="col-span-4 min-w-0 border-l-2 border-ink pl-10">
              <ModuleHeading index={2} label="Libraries" />
              <div className="mt-10">
                <LibraryReferencePanel />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Module 03 — Projects */}
      <section className="border-t-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <div className="mb-10 flex items-end justify-between gap-6">
            <ModuleHeading index={3} label="Projects" />
            <span
              aria-label={`${projects.length} total projects`}
              className="font-black leading-none text-ink"
              style={{
                fontSize: "clamp(48px, 6vw, 96px)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(projects.length).padStart(2, "0")}
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
        </div>
      </section>

      {/* Bottom info band */}
      <footer className="border-t-2 border-ink px-8 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between text-[10px] uppercase font-semibold tracking-[0.1em] text-ink">
          <span>ai-video-router · local-only</span>
          <span>Swiss · {today.getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

function ModuleHeading({ index, label }: { index: number; label: string }) {
  return (
    <div>
      <span
        className="block font-black leading-none text-ink"
        style={{
          fontSize: "clamp(48px, 5vw, 72px)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(index).padStart(2, "0")}.
      </span>
      <span className="mt-3 block text-xs uppercase font-bold tracking-[0.15em] text-ink">
        {label}
      </span>
    </div>
  );
}
