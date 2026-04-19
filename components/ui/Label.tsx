import { cn } from "@/lib/cn";

interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** When true, reduce tracking slightly for tighter inline labels. */
  tight?: boolean;
  /**
   * Optional zero-padded index rendered as a monospaced gutter before the
   * label text (e.g. `01 library`). Signature element of the Terminal
   * Paper direction.
   */
  index?: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * The uppercase micro label pattern used throughout the app for section
 * kickers, column headers, and meta field names.
 */
export function Label({
  className,
  tight = false,
  index,
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
      {typeof index === "number" && (
        <span className="mr-2 text-text-tertiary/60 normal-case tracking-normal">
          {pad(index)}
        </span>
      )}
      {children}
    </span>
  );
}
