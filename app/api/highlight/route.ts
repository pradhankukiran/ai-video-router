import { z } from "zod";
import { jsonError, parseJsonBody } from "@/lib/http";
import { highlightCode } from "@/lib/shiki";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().max(100_000),
  lang: z.string().max(32).optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, bodySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const html = await highlightCode(parsed.code, parsed.lang);
    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(500, `Highlight failed: ${message}`);
  }
}
