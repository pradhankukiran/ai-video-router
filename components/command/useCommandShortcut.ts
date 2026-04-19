"use client";

import { useEffect } from "react";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Install a global ⌘K / Ctrl+K handler that calls `toggle`. Suppressed when
 * focus is inside a text input / textarea / contenteditable so chat typing
 * isn't hijacked. The palette's own input is also a typing target, but by
 * then the palette is already open — the shortcut doesn't re-close it via
 * this path (cmdk handles Escape internally).
 */
export function useCommandShortcut(toggle: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "k" && e.key !== "K") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);
}
