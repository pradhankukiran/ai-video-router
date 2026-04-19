import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { LibraryKey, Paradigm } from "../drivers/types";

export type { LibraryKey, Paradigm };

export interface ProjectRow {
  id: string;
  title: string;
  library: LibraryKey;
  paradigm: Paradigm;
  prompt: string;
  path: string;
  session_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateProjectInput {
  id?: string;
  title: string;
  library: LibraryKey;
  paradigm: Paradigm;
  prompt: string;
  path: string;
}

export function createProject(input: CreateProjectInput): ProjectRow {
  const now = Date.now();
  const id = input.id ?? randomUUID();
  const row: ProjectRow = {
    id,
    title: input.title,
    library: input.library,
    paradigm: input.paradigm,
    prompt: input.prompt,
    path: input.path,
    session_id: null,
    created_at: now,
    updated_at: now,
  };
  getDb()
    .prepare(
      `INSERT INTO projects (id, title, library, paradigm, prompt, path, session_id, created_at, updated_at)
       VALUES (@id, @title, @library, @paradigm, @prompt, @path, @session_id, @created_at, @updated_at)`,
    )
    .run(row);
  return row;
}

export function getProject(id: string): ProjectRow | null {
  const row = getDb()
    .prepare<[string], ProjectRow>(`SELECT * FROM projects WHERE id = ?`)
    .get(id);
  return row ?? null;
}

export function listProjects(): ProjectRow[] {
  return getDb()
    .prepare<[], ProjectRow>(
      `SELECT * FROM projects ORDER BY updated_at DESC`,
    )
    .all();
}

export function setProjectSessionId(id: string, sessionId: string): void {
  getDb()
    .prepare(
      `UPDATE projects SET session_id = ?, updated_at = ? WHERE id = ?`,
    )
    .run(sessionId, Date.now(), id);
}

export function deleteProject(id: string): void {
  getDb().prepare(`DELETE FROM projects WHERE id = ?`).run(id);
}
