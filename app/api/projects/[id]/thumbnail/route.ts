import fs from "node:fs";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { listRenders } from "@/lib/queries/renders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * Serve the JPEG thumbnail extracted alongside the latest successful render
 * of a project. Returns 404 if the project has no completed renders yet, or
 * if the ffmpeg extraction step previously failed (the MP4 exists, the JPG
 * doesn't). The landing card handles 404 by rendering a placeholder.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id");

  const latest = listRenders(id).find(
    (r) => r.status === "done" && typeof r.out_path === "string",
  );
  if (!latest?.out_path) return jsonError(404, "No thumbnail available");

  const jpg = `${latest.out_path}.jpg`;
  if (!fs.existsSync(jpg)) return jsonError(404, "Thumbnail missing on disk");

  const stat = await fs.promises.stat(jpg);
  const nodeStream = fs.createReadStream(jpg);
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk: string | Buffer) => {
        const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(
          new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
        );
      });
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(stat.size),
      "Cache-Control": "private, max-age=60",
    },
  });
}
