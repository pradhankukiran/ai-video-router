import Database from "better-sqlite3";
import { DB_FILE, ensureRoot } from "./paths";

declare global {
  // eslint-disable-next-line no-var
  var __avr_db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (globalThis.__avr_db) return globalThis.__avr_db;
  ensureRoot();
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  globalThis.__avr_db = db;
  return db;
}

function migrate(db: Database.Database): void {
  // One-off: drop a legacy `messages` schema (role/content_json) that
  // predates the Kinetic Paper chat-history persistence design. The
  // current schema below uses `seq`/`kind`/`payload`; if the old shape
  // exists it's empty and can be dropped without data loss. Skip the
  // drop as soon as the new schema is live.
  const messageCols = db
    .pragma("table_info(messages)") as Array<{ name: string }>;
  const hasLegacyMessages =
    messageCols.some((c) => c.name === "role") &&
    !messageCols.some((c) => c.name === "seq");
  if (hasLegacyMessages) {
    db.exec("DROP TABLE messages");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      library       TEXT NOT NULL,
      paradigm      TEXT NOT NULL,
      prompt        TEXT NOT NULL,
      path          TEXT NOT NULL,
      session_id    TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS renders (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      kind          TEXT NOT NULL,
      out_path      TEXT,
      status        TEXT NOT NULL,
      started_at    INTEGER NOT NULL,
      finished_at   INTEGER,
      error         TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS renders_project ON renders(project_id);

    CREATE TABLE IF NOT EXISTS messages (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      seq           INTEGER NOT NULL,
      kind          TEXT NOT NULL,
      payload       TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS messages_project_seq ON messages(project_id, seq);
  `);
}
