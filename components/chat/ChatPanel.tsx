"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { parseSseStream } from "@/lib/sse";
import { Alert } from "@/components/ui/Alert";

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

export function ChatPanel({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= 80) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [entries]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
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
  }, [input, streaming, projectId]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">
            Ask Claude Code to edit your project.
          </p>
        ) : (
          entries.map((e) => <EntryRow key={e.id} entry={e} />)
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
          disabled={streaming}
          className="w-full resize-none border border-line bg-surface px-2 py-1 text-sm focus:border-accent"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
          <span>⌘/Ctrl + Enter to send</span>
          {streaming ? (
            <button
              type="button"
              onClick={cancel}
              className="border border-line bg-surface px-3 py-1 text-xs text-ink hover:bg-surface-subtle"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="border border-line bg-surface px-3 py-1 text-xs text-ink hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function EntryRow({ entry }: { entry: ChatEntry }) {
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
    return <Alert variant="danger">{entry.error}</Alert>;
  }
  if (entry.kind === "stream-cancelled") {
    return <Alert variant="info">turn cancelled</Alert>;
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
