"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ProjectRow } from "@/lib/queries/projects";

export interface WorkspaceActions {
  startPreview: () => Promise<void> | void;
  stopPreview: () => Promise<void> | void;
  restartPreview: () => Promise<void> | void;
  startRender: () => Promise<void> | void;
  cancelRender: () => Promise<void> | void;
  focusChat: () => void;
  focusPromptInput: () => void;
  confirmDelete: () => Promise<void> | void;
}

export interface WorkspaceState {
  project: ProjectRow;
  /** True while the preview dev server is running. */
  previewRunning: boolean;
  /** True while a render is mid-stream. */
  rendering: boolean;
}

interface WorkspaceContextValue {
  state: WorkspaceState;
  setState: (patch: Partial<WorkspaceState>) => void;
  actions: React.MutableRefObject<Partial<WorkspaceActions>>;
  register: (partial: Partial<WorkspaceActions>) => void;
}

const Ctx = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  project,
  children,
}: {
  project: ProjectRow;
  children: React.ReactNode;
}) {
  const [state, setStateRaw] = useState<WorkspaceState>({
    project,
    previewRunning: false,
    rendering: false,
  });
  const actionsRef = useRef<Partial<WorkspaceActions>>({});

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      setState: (patch) => setStateRaw((prev) => ({ ...prev, ...patch })),
      actions: actionsRef,
      register: (partial) => {
        actionsRef.current = { ...actionsRef.current, ...partial };
      },
    }),
    [state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Read the workspace context. Returns `null` when not inside a workspace. */
export function useWorkspace(): WorkspaceContextValue | null {
  return useContext(Ctx);
}
