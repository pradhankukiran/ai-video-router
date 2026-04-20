import { cn } from "@/lib/cn";

interface EmptyProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Empty({ title, description, action, className }: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 border-2 border-ink bg-surface px-8 py-16 text-center",
        className,
      )}
    >
      <p className="text-2xl font-bold uppercase tracking-[0.02em] text-ink">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-ink">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
