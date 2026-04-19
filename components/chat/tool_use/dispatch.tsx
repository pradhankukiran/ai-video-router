"use client";

import { BashRow } from "./BashRow";
import { EditRow } from "./EditRow";
import { GenericToolRow } from "./GenericToolRow";
import { GlobRow } from "./GlobRow";
import { GrepRow } from "./GrepRow";
import { ReadRow } from "./ReadRow";
import type { ToolUseBlock } from "./types";
import { WriteRow } from "./WriteRow";

/**
 * Route a tool_use block to the row that knows its input shape. Falls back
 * to `GenericToolRow` for anything unrecognised (e.g. MCP tools, new SDK
 * tools the app doesn't special-case yet).
 */
export function ToolUseDispatch({ block }: { block: ToolUseBlock }) {
  switch (block.name) {
    case "Read":
      return <ReadRow block={block} />;
    case "Edit":
      return <EditRow block={block} />;
    case "Write":
      return <WriteRow block={block} />;
    case "Bash":
      return <BashRow block={block} />;
    case "Glob":
      return <GlobRow block={block} />;
    case "Grep":
      return <GrepRow block={block} />;
    default:
      return <GenericToolRow block={block} />;
  }
}
