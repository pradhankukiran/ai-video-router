import { z } from "zod";

// Single source of truth for the paradigm/library vocabulary used across
// the router, the projects API, and the drivers. Declare zod enums
// first, derive the TS types from them so adding a new value requires
// only one edit.
export const paradigmSchema = z.enum([
  "react",
  "html",
  "generator",
  "browser-ts",
  "json-node",
  "canvas-node",
]);
export type Paradigm = z.infer<typeof paradigmSchema>;

export const librarySchema = z.enum([
  "remotion",
  "hyperframes",
  "motion-canvas",
  "revideo",
  "diffusion-studio",
  "editly",
  "ffcreator",
]);
export type LibraryKey = z.infer<typeof librarySchema>;

export type RenderEvent =
  | { type: "progress"; frame: number; totalFrames: number }
  | { type: "log"; line: string }
  | { type: "done"; outPath: string }
  | { type: "error"; message: string };

export interface PreviewHandle {
  url: string;
  kill: () => Promise<void>;
}

export interface RenderOptions {
  /**
   * Abort the render (kills the driver's child process tree). Drivers should
   * forward this to `killTree(proc)` and push a final error frame.
   */
  signal?: AbortSignal;
}

export interface DriverCapabilities {
  render: boolean;
  preview: boolean;
}

export interface VideoDriver {
  readonly key: LibraryKey;
  readonly paradigm: Paradigm;
  readonly label: string;
  /**
   * Absolute path to the directory under `templates/<key>/` that should be
   * copied when stamping a new project.
   */
  readonly templateDir: string;
  readonly capabilities: DriverCapabilities;
  install(projectPath: string): Promise<void>;
  startPreview(projectPath: string): Promise<PreviewHandle>;
  render(
    projectPath: string,
    outPath: string,
    opts?: RenderOptions,
  ): AsyncIterable<RenderEvent>;
}
