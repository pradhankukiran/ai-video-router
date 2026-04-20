import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { Panel } from "@/components/ui/Panel";
import { LIBRARY_LABEL } from "@/components/command/libraries";
import type { LibraryKey } from "@/lib/drivers/types";

interface Row {
  key: LibraryKey;
  paradigm: string;
  good: string;
}

/** Keep this list in sync with `lib/router/classify.ts` few-shots. */
const ROWS: Row[] = [
  {
    key: "remotion",
    paradigm: "react",
    good: "Explainers, kinetic typography, data-driven templates",
  },
  {
    key: "hyperframes",
    paradigm: "html",
    good: "Marketing videos, avatar-style composition",
  },
  {
    key: "motion-canvas",
    paradigm: "generator",
    good: "Animated diagrams, timed educational content",
  },
  {
    key: "revideo",
    paradigm: "generator",
    good: "Server-rendered, API-driven batch pipelines",
  },
  {
    key: "diffusion-studio",
    paradigm: "browser-ts",
    good: "Timeline UX with realtime preview",
  },
  {
    key: "editly",
    paradigm: "json-node",
    good: "Simple cuts, crossfades, photo montages",
  },
  {
    key: "ffcreator",
    paradigm: "canvas-node",
    good: "Canvas-heavy particles, complex shapes, charts",
  },
];

/**
 * Static reference panel that helps the user understand what each library
 * does. Rendered beside the prompt form on the landing page. Not
 * interactive.
 */
export function LibraryReferencePanel() {
  return (
    <Panel tone="subtle">
      <Panel.Header>
        <Label>libraries</Label>
        <span className="font-mono text-micro text-text-tertiary">
          {ROWS.length}
        </span>
      </Panel.Header>
      <ul className="divide-y-2 divide-ink">
        {ROWS.map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-3 px-3 py-2.5 text-xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-[0.02em] text-ink">
                  {LIBRARY_LABEL[row.key]}
                </span>
                <Badge tone="neutral">{row.paradigm}</Badge>
              </div>
              <p className="mt-1 text-text-secondary">{row.good}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
