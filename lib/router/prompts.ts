export const ROUTER_SYSTEM_PROMPT = `You are a router that classifies a natural-language video description into the best code-based video library.

Libraries and their sweet spots:

- remotion (paradigm: react) — React component composition. Best for kinetic typography, product explainers, data-driven templates, anything that benefits from React ergonomics.
- hyperframes (paradigm: html) — HeyGen's HTML/CSS-based video framework. Best for marketing videos, avatar-style composition, and anyone who wants to design a video like a webpage.
- motion-canvas (paradigm: generator) — TypeScript generator-based imperative animation. Best for animated diagrams, technical explainers, and carefully timed educational content.
- revideo (paradigm: generator) — Motion Canvas fork focused on server-side rendering and API-driven generation. Best for data-driven motion-graphic pipelines.
- diffusion-studio (paradigm: browser-ts) — Browser-native TypeScript timeline with realtime preview. Best for WYSIWYG-ish editing that still lives in code.
- editly (paradigm: json-node) — Declarative JSON on top of ffmpeg/Node. Best for simple cuts, transitions, photo montages, and karaoke-style captions.
- ffcreator (paradigm: canvas-node) — Canvas-imperative Node + ffmpeg. Best for canvas-heavy compositions with particles, complex shapes, and charts.

Rules:
1. Pick exactly ONE library. Prefer specificity over generality — if the prompt is a "product explainer" go remotion, if it's a "marketing video with an avatar" go hyperframes, etc.
2. "paradigm" must match the library exactly.
3. "confidence" in [0, 1]. Use <0.4 if the prompt is ambiguous.
4. "spec" extracts structural attributes. Prefer conservative defaults.
5. "title" is a short human-readable label (≤60 chars) derived from the prompt.
6. Output strict JSON only — no prose, no markdown, no commentary.
`;

export const FEW_SHOT_EXAMPLES = [
  {
    prompt:
      "30 second product explainer for our new invoice automation tool, corporate tone, kinetic title, flat white background",
    output: {
      title: "Invoice automation explainer — 30s",
      library: "remotion",
      paradigm: "react",
      confidence: 0.88,
      rationale:
        "Product explainer with kinetic typography maps to Remotion's React + interpolate strengths.",
      spec: {
        durationSec: 30,
        fps: 30,
        dimensions: "1920x1080",
        tone: "corporate",
        hasAvatar: false,
        hasDataViz: false,
      },
    },
  },
  {
    prompt:
      "45 second HeyGen-style marketing video with an avatar speaking directly to the camera about our new SaaS launch",
    output: {
      title: "SaaS launch avatar spot — 45s",
      library: "hyperframes",
      paradigm: "html",
      confidence: 0.94,
      rationale:
        "HeyGen-style avatar + marketing = Hyperframes' native territory.",
      spec: {
        durationSec: 45,
        fps: 30,
        dimensions: "1920x1080",
        tone: "marketing",
        hasAvatar: true,
        hasDataViz: false,
      },
    },
  },
  {
    prompt:
      "educational animation explaining how HTTP/3 handshakes work, with packets moving across a diagram",
    output: {
      title: "HTTP/3 handshake explainer",
      library: "motion-canvas",
      paradigm: "generator",
      confidence: 0.9,
      rationale:
        "Technical diagram with precisely-timed motion is Motion Canvas' core use case.",
      spec: {
        durationSec: 60,
        fps: 60,
        dimensions: "1920x1080",
        tone: "educational",
        hasAvatar: false,
        hasDataViz: true,
      },
    },
  },
  {
    prompt:
      "batch-generate 500 birthday videos, each personalized with a name and photo supplied by an API",
    output: {
      title: "Personalized birthday video batch",
      library: "revideo",
      paradigm: "generator",
      confidence: 0.86,
      rationale:
        "Batch data-driven rendering from an API is Revideo's server-rendering sweet spot.",
      spec: {
        durationSec: 20,
        fps: 30,
        dimensions: "1080x1920",
        tone: "friendly",
        hasAvatar: false,
        hasDataViz: false,
      },
    },
  },
  {
    prompt:
      "simple 60-second photo slideshow with crossfade transitions and background music",
    output: {
      title: "Photo slideshow — 60s",
      library: "editly",
      paradigm: "json-node",
      confidence: 0.92,
      rationale:
        "Declarative cuts + crossfades + music is exactly what Editly does with minimal code.",
      spec: {
        durationSec: 60,
        fps: 30,
        dimensions: "1920x1080",
        tone: "friendly",
        hasAvatar: false,
        hasDataViz: false,
      },
    },
  },
  {
    prompt:
      "particle explosion animation with thousands of shards forming our logo",
    output: {
      title: "Logo particle explosion",
      library: "ffcreator",
      paradigm: "canvas-node",
      confidence: 0.82,
      rationale:
        "Particle-heavy canvas compositions are FFCreator's specialty.",
      spec: {
        durationSec: 8,
        fps: 60,
        dimensions: "1920x1080",
        tone: "energetic",
        hasAvatar: false,
        hasDataViz: false,
      },
    },
  },
  {
    prompt:
      "timeline-style editor with realtime preview where I can drag clips around and add titles",
    output: {
      title: "Timeline video edit",
      library: "diffusion-studio",
      paradigm: "browser-ts",
      confidence: 0.78,
      rationale:
        "Timeline UX with realtime preview is Diffusion Studio's core model.",
      spec: {
        durationSec: 30,
        fps: 30,
        dimensions: "1920x1080",
        tone: "neutral",
        hasAvatar: false,
        hasDataViz: false,
      },
    },
  },
];

export function buildRouterMessages(userPrompt: string) {
  const fewShot = FEW_SHOT_EXAMPLES.flatMap((ex) => [
    { role: "user" as const, content: ex.prompt },
    { role: "assistant" as const, content: JSON.stringify(ex.output) },
  ]);
  return [
    { role: "system" as const, content: ROUTER_SYSTEM_PROMPT },
    ...fewShot,
    { role: "user" as const, content: userPrompt },
  ];
}
