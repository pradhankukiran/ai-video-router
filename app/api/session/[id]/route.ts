import { z } from "zod";
import { runSession } from "@/lib/sessions/manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().min(1).max(20_000),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid body", issues: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const write = (chunk: unknown) =>
    encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const aborted = () => req.signal.aborted;
      try {
        for await (const msg of runSession({
          projectId: id,
          message: parsed.data.message,
        })) {
          if (aborted()) break;
          controller.enqueue(write(msg));
        }
        if (!aborted()) {
          controller.enqueue(write({ type: "stream-end" }));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(write({ type: "stream-error", error: message }));
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
