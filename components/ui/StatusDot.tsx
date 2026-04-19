import { cn } from "@/lib/cn";

type StatusTone = "neutral" | "accent" | "success" | "danger" | "idle";

interface StatusDotProps {
  tone?: StatusTone;
  pulse?: boolean;
  size?: number;
  className?: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-text-tertiary",
  accent: "bg-action",
  success: "bg-[color:var(--color-success)]",
  danger: "bg-[color:var(--color-danger)]",
  idle: "bg-[color:var(--color-line-strong)]",
};

/**
 * Small colored indicator dot for preview-running, render-in-progress,
 * stream-live, etc. Optional pulse animation uses CSS `var(--dur-slow)`.
 */
export function StatusDot({
  tone = "neutral",
  pulse = false,
  size = 6,
  className,
}: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block rounded-full",
        TONE_CLASS[tone],
        pulse && "animate-pulse",
        className,
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: pulse ? "var(--dur-slow, 240ms)" : undefined,
      }}
    />
  );
}
