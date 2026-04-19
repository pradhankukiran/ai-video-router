import { cn } from "@/lib/cn";

interface SpinnerProps {
  /** Diameter in pixels. Defaults to 12. */
  size?: number;
  /** Accessible label announced by screen readers. */
  label?: string;
  className?: string;
}

/**
 * Pure-CSS rotating spinner. Uses the `--dur-slow` motion token and the
 * `avr-spin` keyframe defined in globals.css.
 */
export function Spinner({
  size = 12,
  label = "Loading",
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-block align-middle", className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <span
        aria-hidden="true"
        className="block h-full w-full rounded-full border-[1.5px] border-border border-t-action"
        style={{
          animation: "avr-spin var(--dur-slow, 240ms) linear infinite",
          animationDuration: "720ms",
        }}
      />
    </span>
  );
}
