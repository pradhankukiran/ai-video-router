"use client";

import { Code } from "@/components/ui/Code";
import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";

export function BashRow({ block }: { block: ToolUseBlock }) {
  const command =
    typeof block.input.command === "string" ? block.input.command : "";
  const description =
    typeof block.input.description === "string"
      ? block.input.description
      : null;

  return (
    <ToolRow
      tool="bash"
      summary={
        description ? (
          <span className="text-text-secondary">{description}</span>
        ) : (
          <span className="font-mono text-text-primary">
            {firstLine(command)}
          </span>
        )
      }
    >
      <div className="p-2">
        <Code code={command} lang="bash" />
      </div>
    </ToolRow>
  );
}

function firstLine(s: string): string {
  const idx = s.indexOf("\n");
  return idx === -1 ? s : s.slice(0, idx) + " …";
}
