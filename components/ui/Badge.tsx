import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "accent" | "danger" | "success";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Render a 6px dot before the label. */
  dot?: boolean;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-ink text-[color:var(--color-accent-ink)]",
  accent:
    "bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)]",
  danger:
    "bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)]",
  success: "bg-ink text-[color:var(--color-accent-ink)]",
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
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-[0.1em] leading-none",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-[6px] w-[6px] rounded-full bg-current"
        />
      )}
      <span className="leading-none">{children}</span>
    </span>
  );
}
