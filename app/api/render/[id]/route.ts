import path from "node:path";
import { NextResponse } from "next/server";
import { getDriver } from "@/lib/drivers";
import { ensureProjectRendersDir } from "@/lib/paths";
import { getProject } from "@/lib/queries/projects";
import {
  createRender,
  failRender,
  finishRender,
  listRenders,
} from "@/lib/queries/renders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json({ renders: listRenders(id) });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const driver = getDriver(project.library);
  const outDir = ensureProjectRendersDir(project.id);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outDir, `${stamp}.mp4`);
  const render = createRender({
    projectId: project.id,
    kind: "export",
    outPath,
  });

  const encoder = new TextEncoder();
  const frame = (obj: unknown) =>
    encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        frame({ type: "start", renderId: render.id, outPath }),
      );
      let finalPath: string | null = null;
      let errorMsg: string | null = null;
      try {
        for await (const event of driver.render(project.path, outPath)) {
          if (req.signal.aborted) break;
          controller.enqueue(frame(event));
          if (event.type === "done") finalPath = event.outPath;
          if (event.type === "error") errorMsg = event.message;
        }
      } catch (err: unknown) {
        errorMsg = err instanceof Error ? err.message : String(err);
        controller.enqueue(frame({ type: "error", message: errorMsg }));
      } finally {
        if (finalPath) finishRender(render.id, finalPath);
        else failRender(render.id, errorMsg ?? "Unknown error");
        try {
          controller.enqueue(
            frame({
              type: "settled",
              status: finalPath ? "done" : "error",
              renderId: render.id,
            }),
          );
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
