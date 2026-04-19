import OpenAI from "openai";
import { z } from "zod";
import { buildRouterMessages } from "./prompts";

const librarySchema = z.enum([
  "remotion",
  "hyperframes",
  "motion-canvas",
  "revideo",
  "diffusion-studio",
  "editly",
  "ffcreator",
]);

const paradigmSchema = z.enum([
  "react",
  "html",
  "generator",
  "browser-ts",
  "json-node",
  "canvas-node",
]);

export const routerOutputSchema = z.object({
  title: z.string().min(1).max(120),
  library: librarySchema,
  paradigm: paradigmSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1).max(500),
  spec: z.object({
    durationSec: z.number().min(1).max(3600),
    fps: z.number().min(1).max(120),
    dimensions: z.string().min(3).max(20),
    tone: z.string().min(1).max(40),
    hasAvatar: z.boolean(),
    hasDataViz: z.boolean(),
  }),
});

export type RouterOutput = z.infer<typeof routerOutputSchema>;

type Provider = "cerebras" | "groq";

interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

function resolveProvider(): ProviderConfig {
  const explicit = (process.env.ROUTER_PROVIDER?.toLowerCase() ??
    "") as Provider | "";
  const modelOverride = process.env.ROUTER_MODEL;

  if (explicit === "cerebras" || (!explicit && process.env.CEREBRAS_API_KEY)) {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) throw new Error("CEREBRAS_API_KEY is not set");
    return {
      baseURL: "https://api.cerebras.ai/v1",
      apiKey,
      model: modelOverride ?? "llama-3.3-70b",
    };
  }
  if (explicit === "groq" || (!explicit && process.env.GROQ_API_KEY)) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    return {
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
      model: modelOverride ?? "llama-3.3-70b-versatile",
    };
  }
  throw new Error(
    "Router is not configured. Set CEREBRAS_API_KEY or GROQ_API_KEY (or ROUTER_PROVIDER).",
  );
}

export async function classifyPrompt(userPrompt: string): Promise<RouterOutput> {
  const cfg = resolveProvider();
  const client = new OpenAI({ baseURL: cfg.baseURL, apiKey: cfg.apiKey });

  const completion = await client.chat.completions.create({
    model: cfg.model,
    messages: buildRouterMessages(userPrompt),
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) throw new Error("Router returned no content");

  const parsed = routerOutputSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(
      `Router output failed validation: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  return parsed.data;
}
