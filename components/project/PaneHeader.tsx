import type { ReactNode } from "react";

interface PaneHeaderProps {
  index: number;
  label: string;
  /** Right-aligned top-row slot (buttons, command trigger, etc.). */
  action?: ReactNode;
  /** Bottom-row content (project meta, status + url, tabs). */
  children?: ReactNode;
}

/**
 * Shared two-row pane header. Both rows have a **fixed height** so the
 * internal hairline rule and the bottom 2px ink rule align across
 * every pane regardless of what row-1 or row-2 content is rendering.
 *
 *   ┌────────────────────────────────────────┐
 *   │ 01  LABEL                [action slot] │  ← row 1: 52px
 *   ├────────────────────────────────────────┤
 *   │ [secondary content]                    │  ← row 2: 44px
 *   ╞════════════════════════════════════════╡  ← 2px ink rule
 */
export function PaneHeader({
  index,
  label,
  action,
  children,
}: PaneHeaderProps) {
  return (
    <header className="border-b-2 border-ink">
      <div className="flex h-[52px] items-center justify-between gap-3 border-b border-ink px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="text-[22px] font-black leading-none text-ink shrink-0"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {String(index).padStart(2, "0")}
          </span>
          <p className="truncate text-[10px] uppercase font-bold tracking-[0.15em] text-ink">
            {label}
          </p>
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </div>
      <div className="flex h-[44px] min-w-0 items-center gap-2 px-4">
        {children}
      </div>
    </header>
  );
}
