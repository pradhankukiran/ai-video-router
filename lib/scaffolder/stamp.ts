import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
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

/**
 * Stamp a new project: pick id, copy the library template into
 * ~/.ai-video-router/projects/<id>/, install deps, write DB row.
 */
export async function scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
  const id = randomUUID();
  const driver = getDriver(input.library);
  const projectPath = ensureProjectDir(id);

  await copyDir(driver.templateDir, projectPath);
  await driver.install(projectPath);

  const project = createProject({
    id,
    title: input.title,
    library: input.library,
    paradigm: input.paradigm,
    prompt: input.prompt,
    path: projectPath,
  });

  return { project };
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === "node_modules" || entry.name === ".next") return;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) await copyDir(srcPath, destPath);
      else if (entry.isFile()) await fs.copyFile(srcPath, destPath);
    }),
  );
}
