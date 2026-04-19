import { NextResponse } from "next/server";
import { z } from "zod";
import { availableLibraries } from "@/lib/drivers";
import { librarySchema, paradigmSchema } from "@/lib/drivers/types";
import { jsonError, parseJsonBody } from "@/lib/http";
import { listProjects } from "@/lib/queries/projects";
import { scaffold } from "@/lib/scaffolder/stamp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(4000),
  library: librarySchema,
  paradigm: paradigmSchema,
});

export async function GET() {
  return NextResponse.json({
    projects: listProjects(),
    supportedLibraries: availableLibraries(),
  });
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, createBodySchema);
  if (parsed instanceof Response) return parsed;

  if (!availableLibraries().includes(parsed.library)) {
    return jsonError(
      400,
      `Library "${parsed.library}" is not implemented yet`,
    );
  }

  try {
    const { project } = await scaffold(parsed);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(500, `Failed to scaffold project: ${message}`);
  }
}
