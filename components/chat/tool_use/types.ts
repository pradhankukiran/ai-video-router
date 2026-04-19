/**
 * Minimal structural shape we rely on from the Agent SDK's tool_use blocks.
 * We avoid importing the SDK's nominal types because they evolve; the row
 * components only need `name` + `input`.
 */
export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Infer a Shiki language id from a filename extension. Falls back to `txt`
 * so the Code block still renders when the extension is unknown.
 */
export function inferLang(filePath: string | undefined): string {
  if (!filePath) return "txt";
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "ts";
    case "tsx":
      return "tsx";
    case "js":
      return "js";
    case "jsx":
      return "jsx";
    case "json":
    case "json5":
      return "json";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "md":
    case "markdown":
      return "markdown";
    case "sh":
    case "bash":
    case "zsh":
      return "bash";
    case "py":
      return "python";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return "txt";
  }
}
