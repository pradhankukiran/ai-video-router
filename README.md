# ai-video-router

Describe a video in natural language, get a scaffolded project in the right code-based video library, then iterate with a scoped Claude Code session.

Local web app that routes an intent to one of:

| Library           | Paradigm              | Good for                       |
| ----------------- | --------------------- | ------------------------------ |
| Remotion          | React components      | Explainers, kinetic typography |
| Hyperframes       | HTML/CSS templates    | Avatar & marketing             |
| Motion Canvas     | TypeScript generators | Animated diagrams              |
| Revideo           | TS generators (fork)  | Server-rendered animations     |
| Diffusion Studio  | Browser-native TS     | Realtime preview               |
| Editly            | JSON-declarative Node | Simple cuts & montages         |
| FFCreator         | Canvas + ffmpeg       | Canvas-heavy compositions      |

Cerebras/Groq Llama 3.3 picks the library from your prompt; the scaffolder stamps a starter project under `~/.ai-video-router/projects/<id>/`; a scoped Claude Code session (via `@anthropic-ai/claude-agent-sdk`) iterates inside it; the preview pane iframes the library's own dev server; the render pane streams progress from the library's native renderer to an MP4.

## Status

v0.1 — usable end-to-end for Remotion and Hyperframes. The other five libraries are scaffolded and routeable; render coverage is library-dependent (see in-app status). See `/home/kiran/.claude/plans/synchronous-giggling-rain.md` for the roadmap.

## Prerequisites

- Node ≥ 20
- `pnpm` on PATH
- `ffmpeg` on PATH (for MP4 export)
- Chrome / Chromium (for Remotion, Diffusion Studio, FFCreator)
- A working `claude` CLI login on the same machine (the editing session inherits your auth)
- A Cerebras or Groq API key for the router

Run `pnpm run doctor` to verify all of the above at once.

## Quickstart

```sh
pnpm install
cp .env.example .env.local   # then fill in CEREBRAS_API_KEY or GROQ_API_KEY
pnpm run doctor
pnpm dev
```

Open http://localhost:3000 and describe your video. The router classifies it, the scaffolder installs deps, and the workspace opens with chat + preview + render.

## Layout

```
app/                   # Next.js App Router (UI + API routes)
  api/router/          # POST: Cerebras/Groq classification
  api/projects/[id]    # project CRUD
  api/session/[id]     # SSE: Claude Code chat
  api/preview/[id]     # start/stop/status for library dev server
  api/render/[id]      # SSE: library native renderer
  api/renders/[id]/file # MP4 download
components/            # React UI (chat, preview, render, landing)
lib/
  drivers/             # VideoDriver impls — one file per library
  router/              # Cerebras/Groq classifier + prompts
  sessions/            # Claude Agent SDK wrapper
  scaffolder/          # template stamper
  preview/             # in-memory preview handle registry
  queries/             # typed SQLite queries
templates/             # starter projects per library
scripts/
  doctor.ts            # pnpm run doctor
```

## Auth & ToS note

This app is explicitly **local, single-user**. It uses your own Claude Code auth from `~/.claude/`. Hosting it to serve other users with your credentials would violate Anthropic's ToS — for a multi-user deployment, swap to BYO or proxied API keys.

## License

Private / unreleased.
