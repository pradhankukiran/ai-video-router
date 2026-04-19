"use client";

import { Code } from "@/components/ui/Code";
import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";

export function GenericToolRow({ block }: { block: ToolUseBlock }) {
  const pretty = JSON.stringify(block.input, null, 2);
  return (
    <ToolRow
      tool={block.name}
      summary={<span className="text-text-tertiary">tool_use</span>}
    >
      <div className="p-2">
        <Code code={pretty} lang="json" />
      </div>
    </ToolRow>
  );
}
