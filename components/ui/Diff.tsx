"use client";

import { diffLines, type Change } from "diff";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

interface DiffProps {
  filePath: string;
  oldContent: string;
  newContent: string;
  /** Reserved for a future syntax-highlighted variant. */
  lang?: string;
  /** Collapse the diff body when total lines exceed this. Defaults to 40. */
  collapseOver?: number;
  className?: string;
}

type Row =
  | {
      kind: "context";
      text: string;
      left: number;
      right: number;
    }
  | { kind: "remove"; text: string; left: number }
  | { kind: "add"; text: string; right: number };

function buildRows(parts: Change[]): Row[] {
  const rows: Row[] = [];
  let left = 1;
  let right = 1;
  for (const part of parts) {
    const lines = part.value.split("\n");
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    for (const text of lines) {
      if (part.added) rows.push({ kind: "add", text, right: right++ });
      else if (part.removed) rows.push({ kind: "remove", text, left: left++ });
      else rows.push({ kind: "context", text, left: left++, right: right++ });
    }
  }
  return rows;
}

/**
 * Unified side-by-side diff with red/green line highlighting. Monospace
 * throughout. Collapses when the diff is long.
 */
export function Diff({
  filePath,
  oldContent,
  newContent,
  collapseOver = 40,
  className,
}: DiffProps) {
  const { rows, additions, removals } = useMemo(() => {
    const parts = diffLines(oldContent, newContent);
    const r = buildRows(parts);
    return {
      rows: r,
      additions: r.filter((row) => row.kind === "add").length,
      removals: r.filter((row) => row.kind === "remove").length,
    };
  }, [oldContent, newContent]);

  const isLong = rows.length > collapseOver;
  const [open, setOpen] = useState(!isLong);

  return (
    <div className={cn("border border-border bg-bg", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border bg-bg-subtle px-2 py-1 text-xs">
        <span className="truncate font-mono text-text-primary">{filePath}</span>
        <span className="flex items-center gap-1">
          {additions > 0 && <Badge tone="success">+{additions}</Badge>}
          {removals > 0 && <Badge tone="danger">-{removals}</Badge>}
          {isLong && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="ml-1 border border-border bg-bg px-2 py-0.5 font-mono text-micro text-text-secondary hover:bg-bg-subtle"
            >
              {open ? "collapse" : "expand"}
            </button>
          )}
        </span>
      </header>
      {open && (
        <ol className="overflow-x-auto font-mono text-xs leading-[18px]">
          {rows.map((row, i) => (
            <DiffLine key={i} row={row} />
          ))}
        </ol>
      )}
    </div>
  );
}

function DiffLine({ row }: { row: Row }) {
  if (row.kind === "context") {
    return (
      <li className="grid grid-cols-[2.5rem_2.5rem_1fr] whitespace-pre text-text-secondary">
        <span className="border-r border-border bg-bg-subtle px-1 text-right text-text-tertiary">
          {row.left}
        </span>
        <span className="border-r border-border bg-bg-subtle px-1 text-right text-text-tertiary">
          {row.right}
        </span>
        <span className="px-2">{row.text || "\u00a0"}</span>
      </li>
    );
  }
  if (row.kind === "remove") {
    return (
      <li
        className="grid grid-cols-[2.5rem_2.5rem_1fr] whitespace-pre"
        style={{
          backgroundColor:
            "color-mix(in oklab, var(--color-danger) 7%, var(--color-bg))",
        }}
      >
        <span className="border-r border-border bg-bg-subtle px-1 text-right text-text-tertiary">
          {row.left}
        </span>
        <span className="border-r border-border bg-bg-subtle px-1 text-right text-text-tertiary"></span>
        <span className="px-2 text-text-primary">
          <span
            className="mr-1"
            style={{ color: "var(--color-danger)" }}
          >
            -
          </span>
          {row.text || "\u00a0"}
        </span>
      </li>
    );
  }
  return (
    <li
      className="grid grid-cols-[2.5rem_2.5rem_1fr] whitespace-pre"
      style={{
        backgroundColor:
          "color-mix(in oklab, var(--color-success) 7%, var(--color-bg))",
      }}
    >
      <span className="border-r border-border bg-bg-subtle px-1 text-right text-text-tertiary"></span>
      <span className="border-r border-border bg-bg-subtle px-1 text-right text-text-tertiary">
        {row.right}
      </span>
      <span className="px-2 text-text-primary">
        <span
          className="mr-1"
          style={{ color: "var(--color-success)" }}
        >
          +
        </span>
        {row.text || "\u00a0"}
      </span>
    </li>
  );
}
