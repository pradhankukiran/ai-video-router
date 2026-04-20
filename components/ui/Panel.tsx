import { cn } from "@/lib/cn";

type PanelTone = "default" | "subtle" | "accent" | "ink";

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  tone?: PanelTone;
  as?: "section" | "div" | "article" | "aside";
}

const TONE_CLASS: Record<PanelTone, string> = {
  default: "border-2 border-ink bg-surface text-ink",
  subtle: "border-2 border-ink bg-surface-subtle text-ink",
  accent:
    "border-2 border-[color:var(--color-vermilion)] bg-[color:var(--color-vermilion)] text-[color:var(--color-accent-ink)]",
  ink: "border-2 border-ink bg-ink text-[color:var(--color-accent-ink)]",
};

export function Panel({
  tone = "default",
  as: Element = "section",
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <Element {...rest} className={cn(TONE_CLASS[tone], className)}>
      {children}
    </Element>
  );
}

function Header({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Body({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("px-4 py-4", className)}>
      {children}
    </div>
  );
}

function Footer({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-center justify-end gap-2 border-t-2 border-ink px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

Panel.Header = Header;
Panel.Body = Body;
Panel.Footer = Footer;
