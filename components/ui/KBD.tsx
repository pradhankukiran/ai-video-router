import { cn } from "@/lib/cn";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * Keyboard-key chrome. Uses `border-current` so it reads correctly inside
 * light, dark, or hover contexts without extra props.
 */
export function KBD({ className, children, ...rest }: KbdProps) {
  return (
    <kbd
      {...rest}
      className={cn(
        "inline-flex min-w-[1.4em] items-center justify-center border border-current px-1 font-mono text-[10px] leading-[14px]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
