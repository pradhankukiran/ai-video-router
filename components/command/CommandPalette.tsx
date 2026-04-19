"use client";

import { Command } from "cmdk";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

/**
 * Global command palette. Mounted once (via `layout.tsx`); ⌘K / Ctrl+K
 * toggles it from anywhere. Palette content is context-aware: workspace
 * actions appear when a `WorkspaceProvider` is mounted, plain navigation
 * + library docs appear otherwise.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const router = useRouter();
  const workspace = useWorkspace();

  useCommandShortcut(useCallback(() => setOpen((o) => !o), []));

  // Also listen for programmatic opens fired by `<CommandTrigger>` buttons.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("avr:open-command-palette", onOpen);
    return () =>
      window.removeEventListener("avr:open-command-palette", onOpen);
  }, []);

  // Fetch recent projects when opening so the "Projects" group is live.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then(
        (data: { projects?: RecentProject[] }) => {
          if (!cancelled) setRecent((data.projects ?? []).slice(0, 10));
        },
      )
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
      <DialogContent className="top-[20%] translate-y-0 sm:max-w-[560px]">
        <VisuallyHidden.Root>
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search and run any workspace action.
          </DialogDescription>
        </VisuallyHidden.Root>
        <Command
          label="Command palette"
          className="flex flex-col"
          loop
        >
          <Command.Input
            placeholder="Type a command or search…"
            className="w-full border-b border-border bg-bg px-3 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <Command.List className="max-h-[360px] overflow-y-auto py-1 text-sm">
            <Command.Empty className="px-3 py-4 text-center text-xs text-text-tertiary">
              No matches.
            </Command.Empty>

            {workspaceActions && workspace?.state.project && (
              <Command.Group
                heading="Workspace"
                className="px-1 text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
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
                      () =>
                        workspaceActions.restartPreview?.() ?? undefined,
                    )
                  }
                />
                {workspace.state.rendering ? (
                  <CmdItem
                    label="Cancel render"
                    onSelect={() =>
                      run(
                        () =>
                          workspaceActions.cancelRender?.() ?? undefined,
                      )
                    }
                  />
                ) : (
                  <CmdItem
                    label="Render MP4"
                    onSelect={() =>
                      run(
                        () =>
                          workspaceActions.startRender?.() ?? undefined,
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
                      () =>
                        workspaceActions.confirmDelete?.() ?? undefined,
                    )
                  }
                />
              </Command.Group>
            )}

            <Command.Group
              heading="Navigate"
              className="px-1 text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
            >
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

            <Command.Group
              heading="Library docs"
              className="px-1 text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
            >
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
          <footer className="flex items-center justify-between border-t border-border px-3 py-2 text-micro text-text-tertiary">
            <span className="flex items-center gap-1">
              <KBD>↑</KBD>
              <KBD>↓</KBD>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <KBD>Esc</KBD>
              to close
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
        "flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-sm text-text-primary",
        "data-[selected=true]:bg-bg-subtle",
      )}
    >
      <span>{label}</span>
      {shortcut && <KBD>{shortcut}</KBD>}
    </Command.Item>
  );
}
