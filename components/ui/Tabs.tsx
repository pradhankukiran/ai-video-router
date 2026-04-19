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
        "flex items-center gap-1 border-b border-border",
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
        "relative px-3 py-2 text-xs text-text-secondary",
        "data-[state=active]:text-text-primary",
        "after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-transparent",
        "data-[state=active]:after:bg-action",
        className,
      )}
      style={{ transition: "color var(--dur-fast, 120ms) var(--ease-out)" }}
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
