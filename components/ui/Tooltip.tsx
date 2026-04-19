"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

/**
 * Mount once at the application root (see `app/layout.tsx`). A single
 * provider powers every tooltip in the tree.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipPortal = TooltipPrimitive.Portal;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPortal>
      <TooltipPrimitive.Content
        {...rest}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-popover)] select-none border border-border bg-bg px-2 py-1 text-xs text-text-primary",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=delayed-open]:fade-in",
          className,
        )}
        style={{ transitionDuration: "var(--dur-fast, 120ms)" }}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[color:var(--color-bg)] stroke-border" />
      </TooltipPrimitive.Content>
    </TooltipPortal>
  );
}

/**
 * Sugar wrapper for the common case: wrap a trigger and a tooltip body.
 *
 * ```tsx
 * <Tooltip content="Copy">
 *   <button aria-label="Copy project path">…</button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  side,
  delayDuration,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}) {
  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  );
}
