"use client";

import { Diff } from "@/components/ui/Diff";
import type { ToolUseBlock } from "./types";
import { ToolRow } from "./ToolRow";
import { inferLang } from "./types";

export function EditRow({ block }: { block: ToolUseBlock }) {
  const filePath =
    typeof block.input.file_path === "string" ? block.input.file_path : "";
  const oldString =
    typeof block.input.old_string === "string" ? block.input.old_string : "";
  const newString =
    typeof block.input.new_string === "string" ? block.input.new_string : "";
  const replaceAll = Boolean(block.input.replace_all);

  return (
    <ToolRow
      tool="edit"
      summary={
        <span className="flex items-center gap-2">
          <span className="truncate font-mono">
            {filePath || "(no path)"}
          </span>
          {replaceAll && (
            <span className="shrink-0 border border-border bg-bg-subtle px-1 font-mono text-micro uppercase text-text-tertiary">
              replace-all
            </span>
          )}
        </span>
      }
    >
      <Diff
        filePath={filePath || "edit"}
        oldContent={oldString}
        newContent={newString}
        lang={inferLang(filePath)}
        className="border-0"
      />
    </ToolRow>
  );
}
