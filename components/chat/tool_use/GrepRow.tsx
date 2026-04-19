"use client";

import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";

export function GrepRow({ block }: { block: ToolUseBlock }) {
  const pattern =
    typeof block.input.pattern === "string" ? block.input.pattern : "";
  const pathArg = typeof block.input.path === "string" ? block.input.path : null;
  const glob = typeof block.input.glob === "string" ? block.input.glob : null;
  const type_ = typeof block.input.type === "string" ? block.input.type : null;
  return (
    <ToolRow
      tool="grep"
      summary={
        <span className="flex items-center gap-2 font-mono">
          <span className="truncate">{pattern || "(no pattern)"}</span>
          {pathArg && (
            <span className="truncate text-text-tertiary">{pathArg}</span>
          )}
          {glob && (
            <span className="truncate text-text-tertiary">glob:{glob}</span>
          )}
          {type_ && (
            <span className="truncate text-text-tertiary">type:{type_}</span>
          )}
        </span>
      }
    />
  );
}
