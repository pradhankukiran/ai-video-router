import { cn } from "@/lib/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width in CSS (e.g. "100%", "120px"). Defaults to 100%. */
  width?: string;
  /** Height in CSS. Defaults to 1rem. */
  height?: string;
}

/**
 * Loading placeholder block with a subtle shimmer (via the `avr-shimmer`
 * keyframes + motion tokens). Used for async content before it arrives.
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      {...rest}
      aria-hidden="true"
      className={cn("border border-border bg-bg-subtle", className)}
      style={{
        width,
        height,
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.05) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "avr-shimmer var(--dur-slow, 240ms) linear infinite",
        animationDuration: "1400ms",
        ...style,
      }}
    />
  );
}
