import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { getDriver } from "../drivers";
import type { LibraryKey, Paradigm } from "../drivers/types";
import { ensureProjectDir } from "../paths";
import { createProject, type ProjectRow } from "../queries/projects";

export interface ScaffoldInput {
  title: string;
  library: LibraryKey;
  paradigm: Paradigm;
  prompt: string;
}

export interface ScaffoldResult {
  project: ProjectRow;
}

// Names we never want to carry over from templates into a fresh project.
const SKIP_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  ".DS_Store",
  ".env",
  ".env.local",
]);

/**
 * Stamp a new project: pick id, copy the library template into
 * ~/.ai-video-router/projects/<id>/, install deps, write DB row.
 */
export async function scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
  const id = randomUUID();
  const driver = getDriver(input.library);
  const projectPath = ensureProjectDir(id);

  try {
    await copyDir(driver.templateDir, projectPath);
    await driver.install(projectPath);
  } catch (err) {
    // Roll back the half-stamped directory so a failed install leaves no
    // orphan on disk. The API surface sees a clean 500.
    await fsp.rm(projectPath, { recursive: true, force: true });
    throw err;
  }

  try {
    const project = createProject({
      id,
      title: input.title,
      library: input.library,
      paradigm: input.paradigm,
      prompt: input.prompt,
      path: projectPath,
    });
    return { project };
  } catch (err) {
    await fsp.rm(projectPath, { recursive: true, force: true });
    throw err;
  }
}

/**
 * Copy a template tree into a fresh project dir.
 *
 * Uses fs.cp (Node 16.7+, stable in 20+) with dereference: false, plus an
 * explicit symlink refusal in the filter. We'd rather fail loud than chase
 * a symlink out of the template into the host filesystem.
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fsp.cp(src, dest, {
    recursive: true,
    dereference: false,
    errorOnExist: false,
    force: true,
    filter(srcPath: string) {
      const name = path.basename(srcPath);
      if (SKIP_NAMES.has(name)) return false;
      try {
        if (fs.lstatSync(srcPath).isSymbolicLink()) return false;
      } catch {
        // If we can't stat it, don't copy it.
        return false;
      }
      return true;
    },
  });
}
