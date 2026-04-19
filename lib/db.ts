import Database from "better-sqlite3";
import { DB_FILE, ensureRoot } from "./paths";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  ensureRoot();
  _db = new Database(DB_FILE);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database): void {
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
  `);
}
