"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

const OVERLAY_ANIM =
  "data-[state=open]:[animation:avr-overlay-enter_200ms_var(--ease-out)_forwards] " +
  "data-[state=closed]:[animation:avr-overlay-exit_120ms_var(--ease-in)_forwards]";

const CONTENT_ANIM =
  "data-[state=open]:[animation:avr-modal-enter_300ms_cubic-bezier(0.34,1.56,0.64,1)_forwards] " +
  "data-[state=closed]:[animation:avr-modal-exit_160ms_cubic-bezier(0.4,0,1,1)_forwards]";

export function DialogOverlay({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      {...rest}
      className={cn(
        "fixed inset-0 z-[var(--z-overlay)] bg-[color:var(--color-ink)]/40",
        OVERLAY_ANIM,
        className,
      )}
    />
  );
}

/**
 * Centered modal content. A full-viewport grid wrapper places the
 * Content in the true centre of the page regardless of its intrinsic
 * size, so the scale-bounce animation can play without fighting the
 * centering translate.
 *
 * Pass `wrapperClassName` to bias the position (e.g. `items-start pt-[15vh]`
 * for an upper-third command palette look).
 */
export function DialogContent({
  className,
  wrapperClassName,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  wrapperClassName?: string;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[var(--z-modal)] grid place-items-center p-4",
          wrapperClassName,
        )}
      >
        <DialogPrimitive.Content
          {...rest}
          className={cn(
            "pointer-events-auto w-full max-w-[520px]",
            "border-2 border-ink bg-surface font-sans",
            CONTENT_ANIM,
            className,
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-center justify-between border-b-2 border-ink px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DialogFooter({
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

export function DialogTitle({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      {...rest}
      className={cn(
        "text-sm font-bold uppercase tracking-[0.1em] text-ink",
        className,
      )}
    />
  );
}

export function DialogDescription({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      {...rest}
      className={cn("text-xs text-ink", className)}
    />
  );
}
