import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "accent" | "danger" | "success";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Render a 6px dot before the label. */
  dot?: boolean;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "border-border text-text-secondary bg-bg",
  accent: "border-action text-action bg-bg",
  danger: "border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)] bg-bg",
  success:
    "border-[color:var(--color-success)]/40 text-[color:var(--color-success)] bg-bg",
};

const DOT_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-text-tertiary",
  accent: "bg-action",
  danger: "bg-[color:var(--color-danger)]",
  success: "bg-[color:var(--color-success)]",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-xs",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-[6px] w-[6px] rounded-full",
            DOT_CLASS[tone],
          )}
        />
      )}
      <span className="font-mono leading-none">{children}</span>
    </span>
  );
}
