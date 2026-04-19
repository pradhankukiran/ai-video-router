import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { getRender } from "@/lib/queries/renders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ renderId: string }>;
}

const idSchema = z.string().uuid();

export async function GET(_req: Request, { params }: Ctx) {
  const { renderId } = await params;
  if (!idSchema.safeParse(renderId).success) {
    return jsonError(400, "Invalid id");
  }

  const render = getRender(renderId);
  if (!render) return jsonError(404, "Render not found");
  if (render.status !== "done" || !render.out_path) {
    return jsonError(409, `Render is not ready: status=${render.status}`);
  }
  if (!fs.existsSync(render.out_path)) {
    return jsonError(410, "File missing on disk");
  }

  // Resolve symlinks and assert the file lives under this project's out/ dir.
  // Defends against DB tampering or malicious symlink placement.
  let realPath: string;
  try {
    realPath = fs.realpathSync(render.out_path);
  } catch {
    return jsonError(410, "File missing on disk");
  }
  const expectedPrefix =
    path.join(
      os.homedir(),
      ".ai-video-router",
      "projects",
      render.project_id,
      "out",
    ) + path.sep;
  if (!realPath.startsWith(expectedPrefix)) {
    return jsonError(403, "Render path escapes project sandbox");
  }

  const stat = await fs.promises.stat(realPath);
  const nodeStream = fs.createReadStream(realPath);
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

  // Stable, sanitized filename: ${render.id}.mp4 avoids leaking the internal
  // timestamped basename and is guaranteed CR/LF/quote-free.
  const safeName = `${render.id}.mp4`.replace(/[\r\n"]/g, "");
  const encoded = encodeURIComponent(safeName);
  return new Response(webStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    },
  });
}
