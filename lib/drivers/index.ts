import { diffusionStudioDriver } from "./diffusion-studio";
import { editlyDriver } from "./editly";
import { ffcreatorDriver } from "./ffcreator";
import { hyperframesDriver } from "./hyperframes";
import { motionCanvasDriver } from "./motion-canvas";
import { remotionDriver } from "./remotion";
import { revideoDriver } from "./revideo";
import type { LibraryKey, VideoDriver } from "./types";

export const drivers: Partial<Record<LibraryKey, VideoDriver>> = {
  remotion: remotionDriver,
  hyperframes: hyperframesDriver,
  "motion-canvas": motionCanvasDriver,
  revideo: revideoDriver,
  "diffusion-studio": diffusionStudioDriver,
  editly: editlyDriver,
  ffcreator: ffcreatorDriver,
};

export function getDriver(key: LibraryKey): VideoDriver {
  const d = drivers[key];
  if (!d) {
    throw new Error(
      `No driver registered for library "${key}". Available: ${availableLibraries().join(", ")}`,
    );
  }
  return d;
}

export function availableLibraries(): LibraryKey[] {
  return Object.entries(drivers)
    .filter(([, d]) => d != null)
    .map(([k]) => k as LibraryKey);
}
