/**
 * Parse a text/event-stream body into typed events. Each `data:` line is JSON
 * parsed and yielded; malformed or non-data lines are ignored.
 */
export async function* parseSseStream<T>(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<T, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      if (signal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let splitIdx: number;
      while ((splitIdx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, splitIdx);
        buf = buf.slice(splitIdx + 2);
        const dataLine = frame
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        try {
          yield JSON.parse(dataLine.slice(6)) as T;
        } catch {
          /* ignore malformed frame */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
