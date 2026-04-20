"use client";

import { KBD } from "@/components/ui/KBD";
import { cn } from "@/lib/cn";

export function CommandTrigger({ className }: { className?: string }) {
  function onClick() {
    window.dispatchEvent(new CustomEvent("avr:open-command-palette"));
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-[color:var(--color-accent-ink)]",
        className,
      )}
      style={{ transitionDuration: "var(--dur-fast, 100ms)" }}
    >
      <span>Commands</span>
      <KBD>⌘K</KBD>
    </button>
  );
}
