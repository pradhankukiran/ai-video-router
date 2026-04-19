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

After classification, the selected project opens in a chat-driven workspace backed by `@anthropic-ai/claude-agent-sdk`. Claude Code edits the scaffolded project, the preview updates live, and MP4 export runs locally via each library's own renderer.

## Status

v0.1 — under active development. See `/home/kiran/.claude/plans/synchronous-giggling-rain.md` for the roadmap.

## Prerequisites

- Node 20+
- `pnpm` (or `npm`)
- `ffmpeg` on PATH (for MP4 export)
- Chrome / Chromium (for Remotion, Diffusion Studio, FFCreator)
- A working `claude` CLI login on the same machine (the editing session inherits your auth)

## Quickstart

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Auth & ToS note

This app is explicitly **local, single-user**. It uses your own Claude Code auth from `~/.claude/`. Hosting it to serve other users with your credentials would violate Anthropic's ToS — for a multi-user deployment, swap to BYO or proxied API keys.

## License

Private / unreleased.
