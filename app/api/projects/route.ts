import { NextResponse } from "next/server";
import { z } from "zod";
import { scaffold } from "@/lib/scaffolder/stamp";
import { listProjects } from "@/lib/queries/projects";
import { availableLibraries } from "@/lib/drivers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paradigmSchema = z.enum([
  "react",
  "html",
  "generator",
  "browser-ts",
  "json-node",
  "canvas-node",
]);
const librarySchema = z.enum([
  "remotion",
  "hyperframes",
  "motion-canvas",
  "revideo",
  "diffusion-studio",
  "editly",
  "ffcreator",
]);

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
  const json = await req.json();
  const parsed = createBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (!availableLibraries().includes(parsed.data.library)) {
    return NextResponse.json(
      { error: `Library "${parsed.data.library}" is not implemented yet` },
      { status: 400 },
    );
  }

  const { project } = await scaffold(parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
