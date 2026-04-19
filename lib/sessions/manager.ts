import { query, type Options, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { getProject, setProjectSessionId } from "../queries/projects";

export type McpServers = NonNullable<Options["mcpServers"]>;

export interface RunSessionInput {
  projectId: string;
  message: string;
  mcpServers?: McpServers;
  allowedTools?: string[];
}

const DEFAULT_ALLOWED_TOOLS = ["Read", "Edit", "Write", "Bash", "Glob", "Grep"];

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
    allowedTools: input.allowedTools ?? DEFAULT_ALLOWED_TOOLS,
    settingSources: [],
    ...(project.session_id ? { resume: project.session_id } : {}),
    ...(input.mcpServers ? { mcpServers: input.mcpServers } : {}),
  };

  const q = query({ prompt: input.message, options });

  for await (const msg of q) {
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
}

export type { SDKMessage };
