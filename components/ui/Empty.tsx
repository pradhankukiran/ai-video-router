import { cn } from "@/lib/cn";

interface EmptyProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standard empty-state block — dashed 1px border, centered title + optional
 * description + optional action slot. Replaces inline ad-hoc empty markup.
 */
export function Empty({ title, description, action, className }: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed border-border px-6 py-8 text-center",
        className,
      )}
    >
      <p className="text-sm text-text-secondary">{title}</p>
      {description && (
        <p className="text-xs text-text-tertiary">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
