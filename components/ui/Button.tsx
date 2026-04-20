"use client";

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const BASE =
  "inline-flex items-center gap-2 border-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border-[color:var(--color-vermilion)] bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)] hover:brightness-95 disabled:hover:brightness-100",
  secondary:
    "border-ink bg-surface text-ink hover:bg-ink hover:text-[color:var(--color-accent-ink)] disabled:hover:bg-surface disabled:hover:text-ink",
  danger:
    "border-[color:var(--color-vermilion)] bg-surface text-[color:var(--color-vermilion)] hover:bg-[color:var(--color-vermilion)] hover:text-[color:var(--color-accent-ink)] disabled:hover:bg-surface",
};

export function buttonClassName(
  variant: ButtonVariant = "secondary",
  extra = "",
): string {
  const base = `${BASE} ${VARIANT_CLASSES[variant]}`;
  return extra ? `${base} ${extra}` : base;
}

export function Button({
  variant = "secondary",
  className = "",
  children,
  type,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={buttonClassName(variant, className)}
      style={{ transitionDuration: "var(--dur-fast, 100ms)", ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function ButtonLink({
  variant = "secondary",
  className = "",
  children,
  style,
  ...rest
}: ButtonLinkProps) {
  return (
    <a
      className={buttonClassName(variant, className)}
      style={{ transitionDuration: "var(--dur-fast, 100ms)", ...style }}
      {...rest}
    >
      {children}
    </a>
  );
}
