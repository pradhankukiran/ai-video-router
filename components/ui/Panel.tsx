import { cn } from "@/lib/cn";

type PanelTone = "default" | "subtle";

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  tone?: PanelTone;
  as?: "section" | "div" | "article" | "aside";
}

/**
 * Cardlike container with the app's signature 1px border. Composable via
 * `Panel.Header`, `Panel.Body`, `Panel.Footer` so dividers line up across
 * every panel in the app.
 */
export function Panel({
  tone = "default",
  as: Element = "section",
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <Element
      {...rest}
      className={cn(
        "border border-border",
        tone === "subtle" ? "bg-bg-subtle" : "bg-bg",
        className,
      )}
    >
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
        "flex items-center justify-between gap-2 border-b border-border px-3 py-2",
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
    <div {...rest} className={cn("px-3 py-3", className)}>
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
        "flex items-center justify-end gap-2 border-t border-border px-3 py-2",
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
