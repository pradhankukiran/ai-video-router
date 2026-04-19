import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody } from "@/lib/http";
import { classifyPrompt } from "@/lib/router/classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, bodySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const classification = await classifyPrompt(parsed.prompt);
    return NextResponse.json({ classification });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(500, message);
  }
}
