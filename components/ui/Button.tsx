"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const BASE =
  "px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-accent-ink hover:brightness-95 disabled:hover:brightness-100",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-subtle",
  danger:
    "border border-danger/40 bg-surface text-danger hover:bg-[color:var(--color-danger)]/10",
};

export function Button({
  variant = "secondary",
  className = "",
  children,
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
