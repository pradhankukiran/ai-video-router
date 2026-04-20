"use client";

import { cn } from "@/lib/cn";

interface ToolRowProps {
  tool: string;
  summary?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared chrome for every tool-use row: solid ink tool-name pill on
 * the left, summary on the right, optional expanded body below.
 */
export function ToolRow({ tool, summary, children, className }: ToolRowProps) {
  return (
    <div className={cn("border-2 border-ink bg-surface text-xs", className)}>
      <header className="flex items-center gap-2 px-2 py-2">
        <span className="inline-flex items-center bg-ink px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-[color:var(--color-accent-ink)]">
          {tool}
        </span>
        {summary && (
          <div className="min-w-0 flex-1 truncate text-ink">{summary}</div>
        )}
      </header>
      {children && <div className="border-t-2 border-ink">{children}</div>}
    </div>
  );
}
