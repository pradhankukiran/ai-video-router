import { NextResponse } from "next/server";
import { getDriver } from "@/lib/drivers";
import { getPreview, killPreview, setPreview } from "@/lib/preview/runtime";
import { getProject } from "@/lib/queries/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const handle = getPreview(id);
  return handle
    ? NextResponse.json({ status: "running", url: handle.url })
    : NextResponse.json({ status: "stopped" });
}

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const existing = getPreview(id);
  if (existing) {
    return NextResponse.json({ status: "running", url: existing.url });
  }
  try {
    const driver = getDriver(project.library);
    const handle = await driver.startPreview(project.path);
    setPreview(id, handle);
    return NextResponse.json({ status: "running", url: handle.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to start preview: ${message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await killPreview(id);
  return NextResponse.json({ status: "stopped" });
}
