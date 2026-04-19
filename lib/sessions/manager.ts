import path from "node:path";
import {
  query,
  type CanUseTool,
  type Options,
  type PermissionResult,
  type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { getProject, setProjectSessionId } from "../queries/projects";

export interface RunSessionInput {
  projectId: string;
  message: string;
  signal?: AbortSignal;
}

const BASE_ALLOWED_TOOLS = ["Read", "Edit", "Write", "Bash", "Glob", "Grep"];
const STRICT_ALLOWED_TOOLS = ["Read", "Edit", "Write", "Glob", "Grep"]; // no Bash

/**
 * Tools whose inputs carry a `file_path` we can sandbox. We resolve the
 * path against `projectRoot` and deny anything that escapes it.
 */
const PATH_SANDBOXED_TOOLS = new Set(["Read", "Edit", "Write"]);

/**
 * Best-effort denial patterns for Bash commands that reference obviously
 * sensitive paths outside the project. This is a defense-in-depth layer, NOT
 * a real sandbox — shell is Turing-complete and an adversarial agent can
 * trivially evade these via variable expansion, encoding, or chained
 * redirection. For hard isolation, set `AVR_STRICT=1` (drops Bash entirely)
 * or wrap the spawn layer in bwrap/firejail at a future phase.
 */
const BASH_DENY_PATTERNS: RegExp[] = [
  /(^|[\s=;&|`$(])\/etc\b/,
  /(^|[\s=;&|`$(])\/root\b/,
  /(^|[\s=;&|`$(])\/proc\b/,
  /(^|[\s=;&|`$(])\/sys\b/,
  /(^|[\s=;&|`$(])\/boot\b/,
  /\/var\/(log|lib|spool)\b/,
  /(~|\$HOME|\$\{HOME\})\/?\.ssh\b/,
  /(~|\$HOME|\$\{HOME\})\/?\.aws\b/,
  /(~|\$HOME|\$\{HOME\})\/?\.gnupg\b/,
  /\bauthorized_keys\b/,
  /\bid_(rsa|ed25519|ecdsa|dsa)\b/,
  /\brm\s+-rf\s+\/(?!\S*\.ai-video-router)/, // rm -rf / but not inside the project data dir
];

function isStrictMode(): boolean {
  const v = process.env.AVR_STRICT;
  return v === "1" || v?.toLowerCase() === "true";
}

function makeCanUseTool(projectRoot: string): CanUseTool {
  const rootWithSep = projectRoot.endsWith(path.sep)
    ? projectRoot
    : projectRoot + path.sep;
  return async (toolName, input): Promise<PermissionResult> => {
    if (toolName === "Bash") {
      const command = typeof input.command === "string" ? input.command : "";
      for (const re of BASH_DENY_PATTERNS) {
        if (re.test(command)) {
          return {
            behavior: "deny",
            message: `Bash: command references a path outside the project sandbox (matched ${re.source})`,
          };
        }
      }
      return { behavior: "allow" };
    }

    if (!PATH_SANDBOXED_TOOLS.has(toolName)) {
      return { behavior: "allow" };
    }
    const raw = input.file_path;
    if (typeof raw !== "string" || raw.length === 0) {
      return {
        behavior: "deny",
        message: `${toolName}: missing file_path`,
      };
    }
    const resolved = path.resolve(projectRoot, raw);
    if (resolved !== projectRoot && !resolved.startsWith(rootWithSep)) {
      return {
        behavior: "deny",
        message: `${toolName}: path ${resolved} is outside the project directory`,
      };
    }
    return { behavior: "allow" };
  };
}

/**
 * Stream a Claude Code session scoped to a project's working directory.
 *
 * - Inherits local `~/.claude/` auth (the user's own subscription). Do not
 *   deploy this to a shared server: serving other users with the owner's
 *   credentials violates Anthropic's ToS.
 * - Persists `session_id` on the first `system/init` event so subsequent
 *   calls can resume the same conversation.
 * - `settingSources: []` keeps the user's global `~/.claude/settings.json`
 *   out of every tenant session (defense-in-depth against accidental
 *   setting leaks).
 * - If `signal` aborts, we call the SDK iterator's `.return()` so the
 *   underlying query can release its resources deterministically.
 */
export async function* runSession(
  input: RunSessionInput,
): AsyncGenerator<SDKMessage, void, void> {
  const project = getProject(input.projectId);
  if (!project) {
    throw new Error(`Project not found: ${input.projectId}`);
  }

  const options: Options = {
    cwd: project.path,
    allowedTools: isStrictMode() ? STRICT_ALLOWED_TOOLS : BASE_ALLOWED_TOOLS,
    settingSources: [],
    canUseTool: makeCanUseTool(project.path),
    ...(project.session_id ? { resume: project.session_id } : {}),
  };

  const q = query({ prompt: input.message, options });
  const iter = q[Symbol.asyncIterator]();

  const shutdown = () => {
    // Prefer the SDK's interrupt() control request because it actually
    // shuts down the underlying subprocess; iter.return?.() only
    // short-circuits the async generator on our side. The d.ts notes
    // interrupt is "only supported when streaming input/output is
    // used" — for a plain-string prompt it may reject with an
    // unsupported-subtype error — so we swallow any rejection and
    // still release the iterator as a fallback.
    if (typeof q.interrupt === "function") {
      void Promise.resolve(q.interrupt()).catch(() => {
        /* unsupported or already closed */
      });
    }
    void iter.return?.(undefined);
  };
  if (input.signal) {
    if (input.signal.aborted) {
      shutdown();
      return;
    }
    input.signal.addEventListener("abort", shutdown, { once: true });
  }

  try {
    while (true) {
      const { value: msg, done } = await iter.next();
      if (done) return;
      if (
        msg.type === "system" &&
        msg.subtype === "init" &&
        "session_id" in msg &&
        typeof msg.session_id === "string" &&
        !project.session_id
      ) {
        setProjectSessionId(project.id, msg.session_id);
      }
      yield msg;
    }
  } finally {
    input.signal?.removeEventListener("abort", shutdown);
  }
}
