import { cn } from "@/lib/cn";

interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tight?: boolean;
  /** Optional zero-padded index rendered as a bold tabular ink numeral. */
  index?: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

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
        "inline-flex items-baseline gap-2 text-[11px] uppercase font-semibold text-ink",
        tight ? "tracking-[0.05em]" : "tracking-[0.1em]",
        className,
      )}
    >
      {typeof index === "number" && (
        <span
          className="text-[13px] font-bold normal-case tracking-normal text-ink"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pad(index)}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
