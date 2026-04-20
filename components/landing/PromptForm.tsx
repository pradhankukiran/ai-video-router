"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectHref } from "@/components/routes";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { StatusDot } from "@/components/ui/StatusDot";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";

type Phase = "idle" | "classifying" | "scaffolding";

const EXAMPLE_PROMPTS = [
  "30 second product explainer for our new invoice automation tool, corporate tone, kinetic title, flat white background",
  "45 second marketing video with an avatar speaking directly to camera about our new SaaS launch",
  "Educational animation explaining how HTTP/3 handshakes work, packets moving across a diagram",
  "60 second photo slideshow with crossfade transitions and background music",
  "Particle explosion animation with thousands of shards forming our logo",
];

interface Classification {
  title: string;
  library: string;
  paradigm: string;
  confidence: number;
  rationale: string;
  spec: {
    durationSec: number;
    fps: number;
    dimensions: string;
    tone: string;
    hasAvatar: boolean;
    hasDataViz: boolean;
  };
}

export function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [classification, setClassification] = useState<Classification | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function classify(e: React.FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || phase !== "idle") return;
    setError(null);
    setClassification(null);
    setPhase("classifying");
    try {
      const res = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        body: JSON.stringify({ prompt: text }),
      });
      const data: { classification?: Classification; error?: string } =
        await res.json();
      if (!res.ok || !data.classification) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setClassification(data.classification);
      setPhase("idle");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  async function scaffold() {
    if (!classification) return;
    setPhase("scaffolding");
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-avr": "1" },
        body: JSON.stringify({
          title: classification.title,
          prompt: prompt.trim(),
          library: classification.library,
          paradigm: classification.paradigm,
        }),
      });
      const data: { project?: { id: string }; error?: string } =
        await res.json();
      if (!res.ok || !data.project) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      router.push(projectHref(data.project.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  return (
    <Panel>
      <form onSubmit={classify}>
        <Panel.Header>
          <Label>describe the video</Label>
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            {phase === "classifying" && (
              <>
                <StatusDot tone="accent" pulse />
                <Spinner size={10} label="Routing" />
                <span>routing…</span>
              </>
            )}
            {phase === "scaffolding" && (
              <>
                <StatusDot tone="accent" pulse />
                <Spinner size={10} label="Scaffolding" />
                <span>scaffolding…</span>
              </>
            )}
            {phase === "idle" && !classification && (
              <span>Groq Llama 4 Scout</span>
            )}
          </div>
        </Panel.Header>
        <Panel.Body>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            disabled={phase !== "idle"}
            className="w-full resize-y border-2 border-ink bg-surface px-3 py-2 text-sm text-ink focus:border-[color:var(--color-vermilion)] disabled:opacity-60"
            placeholder="30s product explainer, corporate tone, kinetic title, neutral palette…"
          />
          <div className="mt-6">
            <Label>Try</Label>
            <ul className="mt-2 divide-y divide-border-soft border-y border-border-soft">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setPrompt(ex)}
                    disabled={phase !== "idle"}
                    className="group flex w-full items-start gap-3 py-2.5 text-left text-xs text-ink transition-colors hover:text-[color:var(--color-vermilion)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[1px] shrink-0 font-bold text-[color:var(--color-vermilion)] opacity-60 group-hover:opacity-100"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{ex}</span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ↵
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel.Body>
        {!classification && (
          <Panel.Footer>
            <Button
              type="submit"
              variant="primary"
              disabled={phase !== "idle" || !prompt.trim()}
            >
              {phase === "classifying" ? "Routing…" : "Route"}
            </Button>
          </Panel.Footer>
        )}
      </form>

      {classification && (
        <ClassificationPreview
          classification={classification}
          onConfirm={scaffold}
          onCancel={() => setClassification(null)}
          submitting={phase === "scaffolding"}
        />
      )}

      {error && (
        <div className="border-t-2 border-ink p-3">
          <Alert variant="danger" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
    </Panel>
  );
}

function ClassificationPreview({
  classification,
  onConfirm,
  onCancel,
  submitting,
}: {
  classification: Classification;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="border-t-2 border-ink bg-bg-subtle">
      <div className="flex items-center justify-between border-b-2 border-ink px-3 py-2">
        <Label>classification</Label>
        <span className="flex items-center gap-2">
          <Badge tone="accent">{classification.library}</Badge>
          <span className="font-mono text-micro text-text-tertiary">
            {(classification.confidence * 100).toFixed(0)}%
          </span>
        </span>
      </div>
      <Tabs defaultValue="summary">
        <TabsList className="px-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="rationale">Rationale</TabsTrigger>
          <TabsTrigger value="spec">Spec</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <dl className="grid grid-cols-[90px_1fr] gap-y-1 px-3 py-3 text-xs">
            <Dt>title</Dt>
            <Dd>{classification.title}</Dd>
            <Dt>paradigm</Dt>
            <Dd className="font-mono">{classification.paradigm}</Dd>
            <Dt>duration</Dt>
            <Dd>
              {classification.spec.durationSec}s @ {classification.spec.fps}fps
            </Dd>
          </dl>
        </TabsContent>
        <TabsContent value="rationale">
          <p className="px-3 py-3 text-xs text-text-secondary">
            {classification.rationale ||
              "No rationale provided by the router."}
          </p>
        </TabsContent>
        <TabsContent value="spec">
          <dl className="grid grid-cols-[90px_1fr] gap-y-1 px-3 py-3 text-xs">
            <Dt>dimensions</Dt>
            <Dd className="font-mono">{classification.spec.dimensions}</Dd>
            <Dt>tone</Dt>
            <Dd>{classification.spec.tone}</Dd>
            <Dt>has avatar</Dt>
            <Dd>{classification.spec.hasAvatar ? "yes" : "no"}</Dd>
            <Dt>data viz</Dt>
            <Dd>{classification.spec.hasDataViz ? "yes" : "no"}</Dd>
          </dl>
        </TabsContent>
      </Tabs>
      <div className="flex items-center justify-end gap-2 border-t-2 border-ink px-3 py-2">
        <Button onClick={onCancel} disabled={submitting}>
          Re-route
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Scaffolding…" : "Scaffold project"}
        </Button>
      </div>
    </div>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-text-tertiary">{children}</dt>;
}

function Dd({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <dd className={`text-text-primary ${className ?? ""}`}>{children}</dd>;
}
