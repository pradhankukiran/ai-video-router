import { cn } from "@/lib/cn";

interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** When true, reduce tracking slightly for tighter inline labels. */
  tight?: boolean;
}

/**
 * The uppercase micro label pattern used throughout the app for section
 * kickers, column headers, and meta field names. Replaces ad-hoc
 * `text-[10px] uppercase tracking-wider text-ink-faint` literals.
 */
export function Label({
  className,
  tight = false,
  children,
  ...rest
}: LabelProps) {
  return (
    <span
      {...rest}
      className={cn(
        "text-micro uppercase text-text-tertiary",
        tight ? "tracking-wide" : "tracking-wider",
        className,
      )}
    >
      {children}
    </span>
  );
}
