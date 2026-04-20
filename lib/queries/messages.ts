import { randomUUID } from "node:crypto";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { getDb } from "../db";

export type MessageKind =
  | "user-prompt"
  | "sdk"
  | "stream-end"
  | "stream-error"
  | "stream-cancelled";

export interface MessageRow {
  id: string;
  project_id: string;
  seq: number;
  kind: MessageKind;
  payload: string;
  created_at: number;
}

export type MessageEntry =
  | { kind: "user-prompt"; id: string; text: string }
  | { kind: "sdk"; id: string; message: SDKMessage }
  | { kind: "stream-end"; id: string }
  | { kind: "stream-error"; id: string; error: string }
  | { kind: "stream-cancelled"; id: string };

export function appendMessage(
  projectId: string,
  kind: MessageKind,
  payload: unknown,
): MessageRow {
  const db = getDb();
  const row: MessageRow = {
    id: randomUUID(),
    project_id: projectId,
    seq:
      (db
        .prepare<[string], { next: number }>(
          `SELECT COALESCE(MAX(seq), -1) + 1 AS next FROM messages WHERE project_id = ?`,
        )
        .get(projectId)?.next ?? 0),
    kind,
    payload: JSON.stringify(payload),
    created_at: Date.now(),
  };
  db.prepare(
    `INSERT INTO messages (id, project_id, seq, kind, payload, created_at)
     VALUES (@id, @project_id, @seq, @kind, @payload, @created_at)`,
  ).run(row);
  return row;
}

export function listMessages(projectId: string): MessageRow[] {
  return getDb()
    .prepare<[string], MessageRow>(
      `SELECT * FROM messages WHERE project_id = ? ORDER BY seq ASC`,
    )
    .all(projectId);
}

/**
 * Decode persisted MessageRow into the same shape the ChatPanel renders
 * at runtime. Server + client share the type via @/lib/queries/messages.
 */
export function rowsToEntries(rows: MessageRow[]): MessageEntry[] {
  return rows.map((r) => {
    const payload: unknown = JSON.parse(r.payload);
    switch (r.kind) {
      case "user-prompt": {
        const text =
          typeof payload === "object" && payload && "text" in payload
            ? String((payload as { text: unknown }).text ?? "")
            : "";
        return { kind: "user-prompt", id: r.id, text };
      }
      case "sdk":
        return { kind: "sdk", id: r.id, message: payload as SDKMessage };
      case "stream-end":
        return { kind: "stream-end", id: r.id };
      case "stream-error": {
        const error =
          typeof payload === "object" && payload && "error" in payload
            ? String((payload as { error: unknown }).error ?? "")
            : "";
        return { kind: "stream-error", id: r.id, error };
      }
      case "stream-cancelled":
        return { kind: "stream-cancelled", id: r.id };
    }
  });
}
