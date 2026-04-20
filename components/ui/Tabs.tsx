"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      {...rest}
      className={cn(
        "flex items-center gap-2 border-b-2 border-ink",
        className,
      )}
    />
  );
}

export function TabsTrigger({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      {...rest}
      className={cn(
        "relative px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink",
        "after:absolute after:inset-x-0 after:bottom-[-2px] after:h-[3px] after:bg-transparent",
        "data-[state=active]:after:bg-[color:var(--color-vermilion)]",
        className,
      )}
      style={{ transition: "color var(--dur-fast, 100ms) var(--ease-out)" }}
    />
  );
}

export function TabsContent({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      {...rest}
      className={cn("focus-visible:outline-none", className)}
    />
  );
}
