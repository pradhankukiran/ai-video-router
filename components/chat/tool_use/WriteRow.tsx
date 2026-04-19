"use client";

import { Diff } from "@/components/ui/Diff";
import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";
import { inferLang } from "./types";

export function WriteRow({ block }: { block: ToolUseBlock }) {
  const filePath =
    typeof block.input.file_path === "string" ? block.input.file_path : "";
  const content =
    typeof block.input.content === "string" ? block.input.content : "";

  return (
    <ToolRow
      tool="write"
      summary={<span className="truncate font-mono">{filePath || "(no path)"}</span>}
    >
      <Diff
        filePath={filePath || "write"}
        oldContent=""
        newContent={content}
        lang={inferLang(filePath)}
        className="border-0"
      />
    </ToolRow>
  );
}
