"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { parseSseStream } from "@/lib/sse";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

type UserPrompt = { kind: "user-prompt"; id: string; text: string };
type StreamEnd = { kind: "stream-end"; id: string };
type StreamError = { kind: "stream-error"; id: string; error: string };
type StreamCancelled = { kind: "stream-cancelled"; id: string };
type SdkEvent = { kind: "sdk"; id: string; message: SDKMessage };
type ChatEntry =
  | UserPrompt
  | StreamEnd
  | StreamError
  | StreamCancelled
  | SdkEvent;

type WireEvent =
  | SDKMessage
  | { type: "stream-end" }
  | { type: "stream-error"; error: string };

let nextLocalId = 0;
const newId = () => `e${++nextLocalId}`;

export function ChatPanel({
  projectId,
  initialPrompt,
}: {
  projectId: string;
  /**
   * When set, the panel auto-sends this as the first user turn so Claude
   * Code starts editing the scaffold toward the user's original prompt
   * without the user needing to retype it. Pass `null` for projects that
   * already have a session_id (i.e. the user has resumed an existing
   * project and should not have the prompt re-sent).
   */
  initialPrompt?: string | null;
}) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingAbortRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSentRef = useRef(false);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const MAX_HEIGHT_PX = 240;
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [input]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= 80) {
      el.scrollTo({ top: el.scrollHeight });
      setHasNewBelow(false);
    } else {
      setHasNewBelow(true);
    }
  }, [entries]);

  // Clear the "new activity" pill when the user scrolls back near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom <= 80) setHasNewBelow(false);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setHasNewBelow(false);
  }, []);

  // On (re-)mount, cancel any pending abort scheduled by a prior cleanup.
  // React strict-mode in dev runs mount → cleanup → mount, which would
  // otherwise kill the auto-send fetch we just started. Debouncing the
  // abort lets the remount rescue the stream; a real unmount (route
  // change, tab close) still aborts after the grace window.
  useEffect(() => {
    if (pendingAbortRef.current) {
      clearTimeout(pendingAbortRef.current);
      pendingAbortRef.current = null;
    }
    return () => {
      const ctrl = abortRef.current;
      if (!ctrl) return;
      pendingAbortRef.current = setTimeout(() => {
        ctrl.abort();
        pendingAbortRef.current = null;
      }, 150);
    };
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;
      setEntries((es) => [...es, { kind: "user-prompt", id: newId(), text }]);
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/session/${projectId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-avr": "1" },
          body: JSON.stringify({ message: text }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`session request failed: ${res.status}`);
        }
        for await (const ev of parseSseStream<WireEvent>(res.body)) {
          if (ev.type === "stream-end") {
            setEntries((es) => [...es, { kind: "stream-end", id: newId() }]);
          } else if (ev.type === "stream-error") {
            setEntries((es) => [
              ...es,
              { kind: "stream-error", id: newId(), error: ev.error },
            ]);
          } else {
            setEntries((es) => [
              ...es,
              { kind: "sdk", id: newId(), message: ev },
            ]);
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          setEntries((es) => [
            ...es,
            { kind: "stream-cancelled", id: newId() },
          ]);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setEntries((es) => [
            ...es,
            { kind: "stream-error", id: newId(), error: message },
          ]);
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [streaming, projectId],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendText(text);
  }, [input, sendText]);

  // Auto-send the project's original prompt as the first user turn. Guarded
  // by a ref so React strict-mode's double-invocation doesn't send twice.
  useEffect(() => {
    if (!initialPrompt || autoSentRef.current) return;
    autoSentRef.current = true;
    void sendText(initialPrompt);
  }, [initialPrompt, sendText]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          aria-live="polite"
          aria-relevant="additions"
          className="h-full space-y-2 overflow-y-auto px-4 py-3"
        >
          {entries.length === 0 ? (
            <div className="py-8 text-center text-sm">
              <p className="text-ink-muted">
                Ask Claude Code to edit your project.
              </p>
              <p className="mt-2 text-xs text-ink-faint">
                Try: &ldquo;Shorten the title to 60px and make the subtitle
                italic.&rdquo;
              </p>
            </div>
          ) : (
            entries.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                onDismiss={() =>
                  setEntries((es) => es.filter((x) => x.id !== e.id))
                }
              />
            ))
          )}
        </div>
        {hasNewBelow && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 border border-line bg-surface px-2 py-1 text-[11px] text-ink shadow-none hover:bg-surface-subtle"
          >
            ↓ new activity
          </button>
        )}
      </div>
      <form
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Describe the change…"
          rows={3}
          className="w-full resize-none overflow-y-auto border border-line bg-surface px-2 py-1 text-sm focus:border-accent"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
          <span>⌘/Ctrl + Enter to send</span>
          {streaming ? (
            <Button onClick={cancel}>Cancel</Button>
          ) : (
            <Button type="submit" disabled={!input.trim()}>
              Send
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function EntryRow({
  entry,
  onDismiss,
}: {
  entry: ChatEntry;
  onDismiss: () => void;
}) {
  if (entry.kind === "user-prompt") {
    return (
      <div className="border border-line bg-surface-subtle px-3 py-2 text-sm">
        <p className="mb-1 text-[10px] uppercase tracking-wider text-ink-faint">
          you
        </p>
        <p className="whitespace-pre-wrap text-ink">{entry.text}</p>
      </div>
    );
  }
  if (entry.kind === "stream-end") {
    return (
      <p className="py-1 text-center text-[10px] uppercase tracking-wider text-ink-faint">
        — turn complete —
      </p>
    );
  }
  if (entry.kind === "stream-error") {
    return (
      <Alert variant="danger" onDismiss={onDismiss}>
        {entry.error}
      </Alert>
    );
  }
  if (entry.kind === "stream-cancelled") {
    return (
      <Alert variant="info" onDismiss={onDismiss}>
        turn cancelled
      </Alert>
    );
  }
  return <SdkRow message={entry.message} />;
}

function SdkRow({ message }: { message: SDKMessage }) {
  if (message.type === "system") {
    return (
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">
        system · {message.subtype}
      </p>
    );
  }
  if (message.type === "result") {
    return (
      <p className="py-1 text-[10px] uppercase tracking-wider text-ink-faint">
        result · {message.subtype}
      </p>
    );
  }
  if (message.type === "assistant") {
    return <AssistantRow message={message} />;
  }
  if (message.type === "user") {
    return <UserToolResultRow message={message} />;
  }
  return null;
}

function AssistantRow({
  message,
}: {
  message: Extract<SDKMessage, { type: "assistant" }>;
}) {
  const blocks = message.message.content;
  return (
    <div className="border border-line px-3 py-2 text-sm">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-ink-faint">
        claude code
      </p>
      <div className="space-y-2">
        {blocks.map((block, i) => {
          if (block.type === "text") {
            return (
              <p key={i} className="whitespace-pre-wrap text-ink">
                {block.text}
              </p>
            );
          }
          if (block.type === "tool_use") {
            return (
              <details
                key={i}
                className="border border-line bg-surface-subtle px-2 py-1 text-xs"
              >
                <summary className="cursor-pointer text-ink-muted">
                  <span className="text-ink">{block.name}</span>
                  <span className="ml-2 text-ink-faint">tool_use</span>
                </summary>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[11px] text-ink-muted">
                  {JSON.stringify(block.input, null, 2)}
                </pre>
              </details>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function UserToolResultRow({
  message,
}: {
  message: Extract<SDKMessage, { type: "user" }>;
}) {
  const blocks = message.message.content;
  if (typeof blocks === "string") return null;
  const toolResults = blocks.filter(
    (b): b is typeof b & { type: "tool_result" } => b.type === "tool_result",
  );
  if (toolResults.length === 0) return null;
  return (
    <div className="space-y-1">
      {toolResults.map((r, i) => (
        <details
          key={i}
          className="border border-line bg-surface-subtle px-2 py-1 text-xs"
        >
          <summary className="cursor-pointer text-ink-muted">
            tool_result
            <span className="ml-2 text-ink-faint">{r.tool_use_id}</span>
          </summary>
          <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-ink-muted">
            {typeof r.content === "string"
              ? r.content
              : JSON.stringify(r.content, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}
