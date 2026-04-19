import { randomUUID } from "node:crypto";
import { getDb } from "../db";

export type RenderStatus = "running" | "done" | "error";
export type RenderKind = "export";

export interface RenderRow {
  id: string;
  project_id: string;
  kind: RenderKind;
  out_path: string | null;
  status: RenderStatus;
  started_at: number;
  finished_at: number | null;
  error: string | null;
}

export function createRender(input: {
  projectId: string;
  kind: RenderKind;
  outPath: string;
}): RenderRow {
  const now = Date.now();
  const id = randomUUID();
  const row: RenderRow = {
    id,
    project_id: input.projectId,
    kind: input.kind,
    out_path: input.outPath,
    status: "running",
    started_at: now,
    finished_at: null,
    error: null,
  };
  getDb()
    .prepare(
      `INSERT INTO renders (id, project_id, kind, out_path, status, started_at, finished_at, error)
       VALUES (@id, @project_id, @kind, @out_path, @status, @started_at, @finished_at, @error)`,
    )
    .run(row);
  return row;
}

export function finishRender(id: string, outPath: string): void {
  getDb()
    .prepare(
      `UPDATE renders SET status = 'done', finished_at = ?, out_path = ? WHERE id = ?`,
    )
    .run(Date.now(), outPath, id);
}

export function failRender(id: string, error: string): void {
  getDb()
    .prepare(
      `UPDATE renders SET status = 'error', finished_at = ?, error = ? WHERE id = ?`,
    )
    .run(Date.now(), error, id);
}

export function listRenders(projectId: string): RenderRow[] {
  return getDb()
    .prepare<[string], RenderRow>(
      `SELECT * FROM renders WHERE project_id = ? ORDER BY started_at DESC`,
    )
    .all(projectId);
}

export function getRender(renderId: string): RenderRow | null {
  const row = getDb()
    .prepare<[string], RenderRow>(`SELECT * FROM renders WHERE id = ?`)
    .get(renderId);
  return row ?? null;
}
