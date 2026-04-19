"use client";

import type { ReactNode } from "react";

type AlertVariant = "danger" | "info" | "success";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  onDismiss?: () => void;
}

const LABELS: Record<AlertVariant, string> = {
  danger: "error",
  info: "info",
  success: "success",
};

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  danger:
    "border-danger/40 bg-[color:var(--color-danger)]/5 text-danger",
  info: "border-line bg-surface-subtle text-ink-muted",
  success:
    "border-success/40 bg-[color:var(--color-success)]/5 text-success",
};

export function Alert({ variant, children, onDismiss }: AlertProps) {
  const role = variant === "danger" ? "alert" : "status";
  const live = variant === "danger" ? "assertive" : "polite";
  return (
    <div
      role={role}
      aria-live={live}
      className={`flex items-start gap-2 border px-3 py-2 text-xs ${VARIANT_CLASSES[variant]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] uppercase tracking-wider">
          {LABELS[variant]}
        </p>
        <div className="whitespace-pre-wrap text-sm">{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${LABELS[variant]}`}
          className="shrink-0 border border-current px-1 py-0 text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100 focus-visible:opacity-100"
        >
          dismiss
        </button>
      ) : null}
    </div>
  );
}
