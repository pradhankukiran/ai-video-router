import { cn } from "@/lib/cn";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * Keyboard-key chrome. Used for inline shortcut hints like `<KBD>⌘K</KBD>`.
 */
export function KBD({ className, children, ...rest }: KbdProps) {
  return (
    <kbd
      {...rest}
      className={cn(
        "inline-flex min-w-[1.4em] items-center justify-center border border-border bg-bg-subtle px-1 font-mono text-micro leading-[14px] text-text-secondary",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
