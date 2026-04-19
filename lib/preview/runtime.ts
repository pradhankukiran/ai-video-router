import type { PreviewHandle } from "../drivers/types";

declare global {
  // eslint-disable-next-line no-var
  var __avr_preview_handles: Map<string, PreviewHandle> | undefined;
  // eslint-disable-next-line no-var
  var __avr_preview_reaper_installed: boolean | undefined;
}

function registry(): Map<string, PreviewHandle> {
  if (!globalThis.__avr_preview_handles) {
    globalThis.__avr_preview_handles = new Map();
  }
  installReaperOnce();
  return globalThis.__avr_preview_handles;
}

/**
 * Next.js HMR reloads this module into a fresh V8 realm; the old module's
 * handles would otherwise leak live child processes across reloads. We anchor
 * the registry on `globalThis` (so both realms see the same map) and register
 * `beforeExit` + `SIGTERM` handlers exactly once so shutdown reaps previews.
 */
function installReaperOnce(): void {
  if (globalThis.__avr_preview_reaper_installed) return;
  globalThis.__avr_preview_reaper_installed = true;

  const reap = () => {
    const reg = globalThis.__avr_preview_handles;
    if (!reg) return;
    for (const [id, handle] of reg) {
      reg.delete(id);
      Promise.resolve(handle.kill()).catch(() => {
        /* already dead */
      });
    }
  };

  process.on("beforeExit", reap);
  process.on("SIGTERM", () => {
    reap();
    // Honour the signal after a small grace window so reap() can fire.
    setTimeout(() => process.exit(0), 100).unref();
  });
}

export function getPreview(projectId: string): PreviewHandle | undefined {
  return registry().get(projectId);
}

export function setPreview(projectId: string, handle: PreviewHandle): void {
  registry().set(projectId, handle);
}

export async function killPreview(projectId: string): Promise<void> {
  const reg = registry();
  const h = reg.get(projectId);
  if (!h) return;
  reg.delete(projectId);
  try {
    await h.kill();
  } catch {
    /* already dead */
  }
}
