import fs from "node:fs";
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
  if (!driver.capabilities.render) {
    return NextResponse.json(
      { error: `Render not supported for ${project.library}` },
      { status: 501 },
    );
  }

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
      let lastLog: string | null = null;
      let gotTerminalEvent = false;
      try {
        for await (const event of driver.render(project.path, outPath, {
          signal: req.signal,
        })) {
          if (req.signal.aborted) break;
          controller.enqueue(frame(event));
          if (event.type === "done") {
            finalPath = event.outPath;
            gotTerminalEvent = true;
          }
          if (event.type === "error") {
            errorMsg = event.message;
            gotTerminalEvent = true;
          }
          if (event.type === "log") {
            // keep only the trimmed last non-empty line for diagnostics
            const trimmed = event.line.trim();
            if (trimmed.length > 0) lastLog = trimmed;
          }
        }
        if (!gotTerminalEvent && !finalPath && !errorMsg) {
          // The driver's iterator ended without pushing done/error. Fall
          // back to whatever context we have.
          errorMsg = lastLog
            ? `Render ended without a terminal event. Last log: ${lastLog}`
            : "Render ended without a terminal event";
        }
      } catch (err: unknown) {
        errorMsg = err instanceof Error ? err.message : String(err);
        controller.enqueue(frame({ type: "error", message: errorMsg }));
      } finally {
        if (req.signal.aborted) {
          errorMsg = "Aborted";
          finalPath = null;
        } else if (finalPath) {
          // Confirm the driver actually wrote the file the stream claimed.
          try {
            const st = fs.statSync(finalPath);
            if (!st.isFile() || st.size === 0) {
              errorMsg = `Render reported done but output is empty or missing: ${finalPath}`;
              finalPath = null;
            }
          } catch {
            errorMsg = `Render reported done but output is missing: ${finalPath}`;
            finalPath = null;
          }
        }

        if (finalPath) finishRender(render.id, finalPath);
        else failRender(render.id, errorMsg ?? "Unknown error");

        try {
          if (!finalPath && errorMsg) {
            controller.enqueue(
              frame({ type: "error", message: errorMsg }),
            );
          }
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
