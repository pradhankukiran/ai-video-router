import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "danger" | "idle";

interface AsciiStatusProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-text-secondary",
  accent: "text-[color:var(--color-accent)]",
  success: "text-[color:var(--color-success)]",
  danger: "text-[color:var(--color-danger)]",
  idle: "text-text-tertiary",
};

/**
 * Compact bracketed status tag rendered in monospace. Terminal Paper
 * signature element — replaces colored pill badges for status indicators.
 *
 *     [ok]   [running]   [!!]
 */
export function AsciiStatus({
  tone = "neutral",
  className,
  children,
}: AsciiStatusProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-micro leading-none",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="text-text-tertiary/60">
        [
      </span>
      <span className="px-0.5">{children}</span>
      <span aria-hidden="true" className="text-text-tertiary/60">
        ]
      </span>
    </span>
  );
}
