"use client";

import { cn } from "@/lib/cn";

interface ToolRowProps {
  tool: string;
  summary?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared chrome for every tool-use row: a small monospace tool name tag on
 * the left, a summary line on the right (usually a filename or query), and
 * optional expanded body below.
 */
export function ToolRow({ tool, summary, children, className }: ToolRowProps) {
  return (
    <div className={cn("border border-border bg-bg text-xs", className)}>
      <header className="flex items-center gap-2 px-2 py-1">
        <span className="border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-micro uppercase tracking-wide text-text-secondary">
          {tool}
        </span>
        {summary && (
          <div className="min-w-0 flex-1 truncate text-text-primary">
            {summary}
          </div>
        )}
      </header>
      {children && <div className="border-t border-border">{children}</div>}
    </div>
  );
}
