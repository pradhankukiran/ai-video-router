"use client";

import { KBD } from "@/components/ui/KBD";
import { cn } from "@/lib/cn";

/**
 * Visible button that hints at ⌘K and dispatches a `CustomEvent` the
 * palette listens for. Kept decoupled from the palette so any surface can
 * render a trigger without depending on the palette's state.
 */
export function CommandTrigger({ className }: { className?: string }) {
  function onClick() {
    window.dispatchEvent(new CustomEvent("avr:open-command-palette"));
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 border border-border bg-bg px-2 py-1 text-xs text-text-secondary hover:bg-bg-subtle",
        className,
      )}
    >
      <span>Commands</span>
      <KBD>⌘K</KBD>
    </button>
  );
}
