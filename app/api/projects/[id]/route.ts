import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { deleteProject, getProject } from "@/lib/queries/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const idSchema = z.string().uuid();

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id");

  const project = getProject(id);
  if (!project) return jsonError(404, "Not found");
  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id");

  const project = getProject(id);
  if (!project) return jsonError(404, "Not found");
  deleteProject(id);
  return NextResponse.json({ ok: true });
}
