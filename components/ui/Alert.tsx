"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertVariant = "danger" | "info" | "success";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  onDismiss?: () => void;
}

const LABELS: Record<AlertVariant, string> = {
  danger: "Error",
  info: "Info",
  success: "Done",
};

const BORDER_CLASS: Record<AlertVariant, string> = {
  danger: "border-[color:var(--color-vermilion)]",
  info: "border-ink",
  success: "border-ink",
};

const LABEL_CLASS: Record<AlertVariant, string> = {
  danger:
    "bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)]",
  info: "bg-ink text-[color:var(--color-accent-ink)]",
  success: "bg-ink text-[color:var(--color-accent-ink)]",
};

export function Alert({ variant, children, onDismiss }: AlertProps) {
  const role = variant === "danger" ? "alert" : "status";
  const live = variant === "danger" ? "assertive" : "polite";
  return (
    <div
      role={role}
      aria-live={live}
      className={cn(
        "flex items-stretch border-2 bg-surface text-xs",
        BORDER_CLASS[variant],
      )}
    >
      <span
        className={cn(
          "flex items-center px-2 text-[10px] uppercase font-bold tracking-[0.1em]",
          LABEL_CLASS[variant],
        )}
      >
        {LABELS[variant]}
      </span>
      <div className="min-w-0 flex-1 whitespace-pre-wrap px-3 py-2 text-sm text-ink">
        {children}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${LABELS[variant]}`}
          className="shrink-0 border-l-2 border-ink px-2 text-[10px] uppercase font-bold tracking-[0.1em] text-ink hover:bg-ink hover:text-[color:var(--color-accent-ink)]"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
