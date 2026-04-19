"use client";

import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";

export function GlobRow({ block }: { block: ToolUseBlock }) {
  const pattern =
    typeof block.input.pattern === "string" ? block.input.pattern : "";
  const pathArg = typeof block.input.path === "string" ? block.input.path : null;
  return (
    <ToolRow
      tool="glob"
      summary={
        <span className="flex items-center gap-2 font-mono">
          <span className="truncate">{pattern || "(no pattern)"}</span>
          {pathArg && (
            <span className="truncate text-text-tertiary">{pathArg}</span>
          )}
        </span>
      }
    />
  );
}
