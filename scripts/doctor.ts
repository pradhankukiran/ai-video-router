/**
 * Check that the system has the tools ai-video-router expects.
 * Run with: pnpm run doctor
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type CheckResult = { name: string; ok: boolean; detail: string };

const results: CheckResult[] = [];

function check(name: string, fn: () => string | Promise<string>): void {
  try {
    const detail = fn();
    const value = typeof detail === "string" ? detail : "";
    results.push({ name, ok: true, detail: value });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
    results.push({ name, ok: false, detail: message ?? "" });
  }
}

function which(cmd: string): string {
  return execSync(`which ${cmd}`, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

function run(cmd: string): string {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

check("node >= 20", () => {
  const v = run("node -v");
  const major = Number(v.replace(/^v/, "").split(".")[0]);
  if (major < 20) throw new Error(`node ${v} is older than 20`);
  return v;
});

check("pnpm on PATH", () => {
  which("pnpm");
  return run("pnpm -v");
});

check("ffmpeg on PATH", () => {
  which("ffmpeg");
  return run("ffmpeg -version").split("\n")[0] ?? "ffmpeg";
});

check("chromium/chrome on PATH", () => {
  for (const candidate of ["google-chrome", "chromium", "chromium-browser"]) {
    try {
      return which(candidate);
    } catch {
      /* keep trying */
    }
  }
  throw new Error("none of google-chrome, chromium, chromium-browser found");
});

check("claude CLI on PATH", () => {
  which("claude");
  return "present (editing sessions will use your local login)";
});

check("~/.ai-video-router writable", () => {
  const dir = path.join(os.homedir(), ".ai-video-router");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
});

const anthropic = process.env.ANTHROPIC_API_KEY;
check("Anthropic auth source", () => {
  if (anthropic) return "ANTHROPIC_API_KEY env var (overrides local login)";
  return "env var not set — will use ~/.claude/ subscription login";
});

check("Router credentials", () => {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  const model =
    process.env.ROUTER_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";
  return `groq · ${model}`;
});

let exit = 0;
for (const r of results) {
  const icon = r.ok ? "[ok] " : "[--] ";
  console.log(`${icon}${r.name}${r.detail ? ` · ${r.detail}` : ""}`);
  if (!r.ok) exit = 1;
}

if (exit !== 0) {
  console.log("\nFix the items marked [--] before running `pnpm dev`.");
}
process.exit(exit);
