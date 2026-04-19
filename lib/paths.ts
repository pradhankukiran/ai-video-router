import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const ROOT = path.join(os.homedir(), ".ai-video-router");
export const PROJECTS_DIR = path.join(ROOT, "projects");
export const DB_FILE = path.join(ROOT, "data.db");

export function ensureRoot(): void {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

export function projectDir(id: string): string {
  return path.join(PROJECTS_DIR, id);
}

export function ensureProjectDir(id: string): string {
  const dir = projectDir(id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function projectRendersDir(id: string): string {
  return path.join(projectDir(id), "out");
}

export function ensureProjectRendersDir(id: string): string {
  const dir = projectRendersDir(id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
