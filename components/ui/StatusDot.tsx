import { cn } from "@/lib/cn";

type StatusTone = "neutral" | "accent" | "success" | "danger" | "idle";

interface StatusDotProps {
  tone?: StatusTone;
  pulse?: boolean;
  size?: number;
  className?: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-ink",
  accent: "bg-[color:var(--color-vermilion)]",
  success: "bg-ink",
  danger: "bg-[color:var(--color-vermilion)]",
  idle: "bg-[color:var(--color-line-soft)]",
};

/**
 * Solid filled circle. Bigger default (10px) so it reads as a
 * compositional dot, not a hairline marker.
 */
export function StatusDot({
  tone = "neutral",
  pulse = false,
  size = 10,
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
        animationDuration: pulse ? "var(--dur-slow, 200ms)" : undefined,
      }}
    />
  );
}
