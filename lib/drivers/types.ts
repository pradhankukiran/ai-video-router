export type Paradigm =
  | "react"
  | "html"
  | "generator"
  | "browser-ts"
  | "json-node"
  | "canvas-node";

export type LibraryKey =
  | "remotion"
  | "hyperframes"
  | "motion-canvas"
  | "revideo"
  | "diffusion-studio"
  | "editly"
  | "ffcreator";

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
