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
            <span className="shrink-0 bg-[color:var(--color-vermilion)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--color-accent-ink)]">
              Replace all
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
