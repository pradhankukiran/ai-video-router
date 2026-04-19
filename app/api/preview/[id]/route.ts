import { NextResponse } from "next/server";
import { z } from "zod";
import { getDriver } from "@/lib/drivers";
import { jsonError } from "@/lib/http";
import { getPreview, killPreview, setPreview } from "@/lib/preview/runtime";
import { getProject } from "@/lib/queries/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const idSchema = z.string().uuid();

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id");

  const handle = getPreview(id);
  return handle
    ? NextResponse.json({ status: "running", url: handle.url })
    : NextResponse.json({ status: "stopped" });
}

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id");

  const project = getProject(id);
  if (!project) return jsonError(404, "Project not found");

  const existing = getPreview(id);
  if (existing) {
    return NextResponse.json({ status: "running", url: existing.url });
  }

  try {
    const driver = getDriver(project.library);
    if (driver.capabilities && !driver.capabilities.preview) {
      return jsonError(
        501,
        `Preview not supported for ${project.library}`,
      );
    }
    const handle = await driver.startPreview(project.path);
    setPreview(id, handle);
    return NextResponse.json({ status: "running", url: handle.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(500, `Failed to start preview: ${message}`);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id");

  await killPreview(id);
  return NextResponse.json({ status: "stopped" });
}
