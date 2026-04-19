import type { z } from "zod";

/**
 * Shared HTTP helpers for API routes. Centralises error shape and JSON body
 * parsing so each route stays terse.
 */

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  const body = { error: message, ...(extra ?? {}) };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Parse + validate a JSON request body against a zod schema.
 * On success returns the parsed value.
 * On failure (invalid JSON, shape mismatch) returns a ready-to-return Response.
 *
 * Callers should branch on `instanceof Response` to distinguish the two.
 */
export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<T | Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { issues: parsed.error.issues });
  }
  return parsed.data;
}

/**
 * Serialise an error into a single SSE frame.
 * Returns a string ending in `\n\n` ready to be written to a text/event-stream.
 */
export function sseErrorFrame(message: string): string {
  const payload = JSON.stringify({ type: "error", message });
  return `data: ${payload}\n\n`;
}
