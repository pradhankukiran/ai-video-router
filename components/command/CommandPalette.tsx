"use client";

import { Command } from "cmdk";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { KBD } from "@/components/ui/KBD";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useWorkspace } from "@/components/project/WorkspaceContext";
import type { LibraryKey } from "@/lib/drivers/types";
import { cn } from "@/lib/cn";
import { projectHref } from "@/components/routes";
import { LIBRARY_DOCS, LIBRARY_LABEL } from "./libraries";
import { useCommandShortcut } from "./useCommandShortcut";

interface RecentProject {
  id: string;
  title: string;
  library: string;
}

const GROUP_CLASS =
  "px-0 text-ink [&_[cmdk-group-heading]]:border-b-2 [&_[cmdk-group-heading]]:border-ink [&_[cmdk-group-heading]]:bg-surface-subtle [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.15em] [&_[cmdk-group-heading]]:text-ink";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const router = useRouter();
  const workspace = useWorkspace();

  useCommandShortcut(useCallback(() => setOpen((o) => !o), []));

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("avr:open-command-palette", onOpen);
    return () =>
      window.removeEventListener("avr:open-command-palette", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data: { projects?: RecentProject[] }) => {
        if (!cancelled) setRecent((data.projects ?? []).slice(0, 10));
      })
      .catch(() => {
        /* keep previous list */
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const run = useCallback(
    (fn: () => Promise<void> | void) => {
      close();
      Promise.resolve()
        .then(() => fn())
        .catch(() => {
          /* command-specific UIs should surface their own errors */
        });
    },
    [close],
  );

  const workspaceActions = workspace?.actions.current;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        wrapperClassName="items-start pt-[14vh]"
        className="sm:max-w-[600px]"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search and run any workspace action.
          </DialogDescription>
        </VisuallyHidden.Root>
        <Command
          label="Command palette"
          className="flex flex-col font-sans"
          loop
        >
          <div className="flex items-stretch border-b-2 border-ink">
            <span className="flex items-center bg-ink px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-accent-ink)]">
              Cmd
            </span>
            <Command.Input
              placeholder="Type a command or search…"
              className="w-full bg-surface px-3 py-3 text-sm font-medium text-ink placeholder:font-normal placeholder:text-ink focus:outline-none"
            />
          </div>
          <Command.List className="max-h-[380px] overflow-y-auto text-sm">
            <Command.Empty className="px-3 py-6 text-center text-xs font-bold uppercase tracking-[0.1em] text-ink">
              No matches
            </Command.Empty>

            {workspaceActions && workspace?.state.project && (
              <Command.Group heading="Workspace" className={GROUP_CLASS}>
                {workspace.state.previewRunning ? (
                  <CmdItem
                    label="Stop preview"
                    onSelect={() =>
                      run(() => workspaceActions.stopPreview?.() ?? undefined)
                    }
                  />
                ) : (
                  <CmdItem
                    label="Start preview"
                    onSelect={() =>
                      run(() => workspaceActions.startPreview?.() ?? undefined)
                    }
                  />
                )}
                <CmdItem
                  label="Restart preview"
                  onSelect={() =>
                    run(
                      () => workspaceActions.restartPreview?.() ?? undefined,
                    )
                  }
                />
                {workspace.state.rendering ? (
                  <CmdItem
                    label="Cancel render"
                    onSelect={() =>
                      run(
                        () => workspaceActions.cancelRender?.() ?? undefined,
                      )
                    }
                  />
                ) : (
                  <CmdItem
                    label="Render MP4"
                    onSelect={() =>
                      run(
                        () => workspaceActions.startRender?.() ?? undefined,
                      )
                    }
                  />
                )}
                <CmdItem
                  label="Focus chat"
                  onSelect={() =>
                    run(() => workspaceActions.focusChat?.() ?? undefined)
                  }
                />
                <CmdItem
                  label="Copy project path"
                  keywords="clipboard directory"
                  onSelect={() =>
                    run(() =>
                      navigator.clipboard.writeText(
                        workspace.state.project.path,
                      ),
                    )
                  }
                />
                {workspace.state.project.session_id && (
                  <CmdItem
                    label="Copy session id"
                    keywords="clipboard claude"
                    onSelect={() =>
                      run(() =>
                        navigator.clipboard.writeText(
                          workspace.state.project.session_id ?? "",
                        ),
                      )
                    }
                  />
                )}
                <CmdItem
                  label="Delete project"
                  keywords="remove danger"
                  onSelect={() =>
                    run(
                      () => workspaceActions.confirmDelete?.() ?? undefined,
                    )
                  }
                />
              </Command.Group>
            )}

            <Command.Group heading="Navigate" className={GROUP_CLASS}>
              <CmdItem
                label="New project"
                keywords="create start"
                shortcut="/"
                onSelect={() =>
                  run(() => {
                    router.push("/" as Route);
                    workspaceActions?.focusPromptInput?.();
                  })
                }
              />
              {recent.map((p) => (
                <CmdItem
                  key={p.id}
                  label={`Open: ${p.title}`}
                  keywords={`${p.library} project`}
                  onSelect={() => run(() => router.push(projectHref(p.id)))}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Library docs" className={GROUP_CLASS}>
              {(Object.keys(LIBRARY_DOCS) as LibraryKey[]).map((lib) => (
                <CmdItem
                  key={lib}
                  label={`Open ${LIBRARY_LABEL[lib]} docs`}
                  keywords={`${lib} docs reference`}
                  onSelect={() =>
                    run(() => {
                      window.open(LIBRARY_DOCS[lib], "_blank");
                    })
                  }
                />
              ))}
            </Command.Group>
          </Command.List>
          <footer className="flex items-center justify-between border-t-2 border-ink bg-surface-subtle px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink">
            <span className="flex items-center gap-1.5">
              <KBD>↑</KBD>
              <KBD>↓</KBD>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <KBD>↵</KBD>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <KBD>Esc</KBD>
              <span>Close</span>
            </span>
          </footer>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CmdItem({
  label,
  keywords,
  shortcut,
  onSelect,
}: {
  label: string;
  keywords?: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${label} ${keywords ?? ""}`}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 border-b border-ink px-3 py-2.5 text-sm font-medium text-ink last:border-b-0",
        "data-[selected=true]:bg-ink data-[selected=true]:text-[color:var(--color-accent-ink)]",
      )}
    >
      <span>{label}</span>
      {shortcut && <KBD>{shortcut}</KBD>}
    </Command.Item>
  );
}
