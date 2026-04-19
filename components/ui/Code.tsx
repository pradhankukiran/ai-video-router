"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

interface CodeProps {
  code: string;
  lang?: string;
  /** When true, render as inline `<code>` instead of a `<pre>` block. */
  inline?: boolean;
  className?: string;
}

// Module-level cache so repeated highlighting of identical blocks (common in
// streaming chat where the same tool_use text re-renders on each entry push)
// doesn't re-hit the API.
const cache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

function cacheKey(lang: string, code: string): string {
  return `${lang}\n${code}`;
}

async function highlight(code: string, lang: string): Promise<string> {
  const key = cacheKey(lang, code);
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const res = await fetch("/api/highlight", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-avr": "1" },
      body: JSON.stringify({ code, lang }),
    });
    if (!res.ok) throw new Error(`highlight: HTTP ${res.status}`);
    const data: { html: string } = await res.json();
    cache.set(key, data.html);
    inFlight.delete(key);
    return data.html;
  })();
  inFlight.set(key, promise);
  return promise;
}

/**
 * Syntax-highlighted code block or inline snippet. Fetches rendered HTML from
 * `/api/highlight` (Shiki on the server). Shows a Skeleton while loading and
 * falls back to plain monospace if the API errors.
 */
export function Code({ code, lang = "txt", inline = false, className }: CodeProps) {
  const [html, setHtml] = useState<string | null>(() =>
    cache.get(cacheKey(lang, code)) ?? null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (html !== null || failed) return;
    let cancelled = false;
    highlight(code, lang)
      .then((out) => {
        if (!cancelled) setHtml(out);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang, html, failed]);

  if (inline) {
    return (
      <code
        className={cn(
          "inline-block border border-border bg-bg-subtle px-1 font-mono text-xs",
          className,
        )}
      >
        {code}
      </code>
    );
  }

  if (html === null && !failed) {
    return <Skeleton className={cn("h-5 w-full", className)} height="1.25rem" />;
  }

  if (failed || html === null) {
    return (
      <pre
        className={cn(
          "overflow-x-auto whitespace-pre-wrap border border-border bg-bg-subtle p-2 font-mono text-xs text-text-primary",
          className,
        )}
      >
        {code}
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "avr-code overflow-x-auto border border-border bg-bg text-xs",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
