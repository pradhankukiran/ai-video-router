import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "danger" | "idle";

interface AsciiStatusProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-ink text-[color:var(--color-accent-ink)]",
  accent:
    "bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)]",
  success: "bg-ink text-[color:var(--color-accent-ink)]",
  danger:
    "bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)]",
  idle: "bg-[color:var(--color-line-soft)] text-ink",
};

/**
 * Solid colour-block status pill — Swiss poster signage.
 */
export function AsciiStatus({
  tone = "neutral",
  className,
  children,
}: AsciiStatusProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-bold leading-none tracking-[0.1em]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
