"use client";

import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";

export function ReadRow({ block }: { block: ToolUseBlock }) {
  const filePath =
    typeof block.input.file_path === "string" ? block.input.file_path : null;
  const offset =
    typeof block.input.offset === "number" ? block.input.offset : null;
  const limit =
    typeof block.input.limit === "number" ? block.input.limit : null;

  return (
    <ToolRow
      tool="read"
      summary={
        <span className="font-mono">
          {filePath ?? "(no path)"}
          {offset !== null && limit !== null && (
            <span className="ml-2 text-text-tertiary">
              L{offset}-{offset + limit}
            </span>
          )}
          {offset !== null && limit === null && (
            <span className="ml-2 text-text-tertiary">from L{offset}</span>
          )}
        </span>
      }
    />
  );
}
