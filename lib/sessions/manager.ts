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

const DEFAULT_ALLOWED_TOOLS = ["Read", "Edit", "Write", "Bash", "Glob", "Grep"];

/**
 * Tools whose inputs carry a `file_path` we can sandbox. We resolve the
 * path against `projectRoot` and deny anything that escapes it.
 *
 * Known limitation: Bash commands receive raw shell strings and are
 * NOT sandboxed here. An assistant-authored `bash -c "cat /etc/passwd"`
 * would still succeed. We accept this for now because Bash commands
 * legitimately need /tmp, $HOME/.cache, and pnpm's global store. If
 * Bash isolation becomes a requirement, swap in `bubblewrap` / a
 * per-project container at the spawn layer.
 */
const PATH_SANDBOXED_TOOLS = new Set(["Read", "Edit", "Write"]);

function makeCanUseTool(projectRoot: string): CanUseTool {
  const rootWithSep = projectRoot.endsWith(path.sep)
    ? projectRoot
    : projectRoot + path.sep;
  return async (toolName, input): Promise<PermissionResult> => {
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
    allowedTools: DEFAULT_ALLOWED_TOOLS,
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
