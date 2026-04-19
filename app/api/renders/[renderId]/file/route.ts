import fs from "node:fs";
import path from "node:path";
import { getRender } from "@/lib/queries/renders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ renderId: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { renderId } = await params;
  const render = getRender(renderId);
  if (!render) {
    return new Response(JSON.stringify({ error: "Render not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (render.status !== "done" || !render.out_path) {
    return new Response(
      JSON.stringify({
        error: `Render is not ready: status=${render.status}`,
      }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (!fs.existsSync(render.out_path)) {
    return new Response(JSON.stringify({ error: "File missing on disk" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stat = await fs.promises.stat(render.out_path);
  const nodeStream = fs.createReadStream(render.out_path);
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk: string | Buffer) => {
        const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(
          new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
          ),
        );
      });
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const filename = path.basename(render.out_path);
  return new Response(webStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
