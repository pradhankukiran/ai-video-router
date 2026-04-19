import type { PreviewHandle } from "../drivers/types";

declare global {
  // eslint-disable-next-line no-var
  var __avr_preview_handles: Map<string, PreviewHandle> | undefined;
}

function registry(): Map<string, PreviewHandle> {
  if (!globalThis.__avr_preview_handles) {
    globalThis.__avr_preview_handles = new Map();
  }
  return globalThis.__avr_preview_handles;
}

export function getPreview(projectId: string): PreviewHandle | undefined {
  return registry().get(projectId);
}

export function setPreview(projectId: string, handle: PreviewHandle): void {
  registry().set(projectId, handle);
}

export async function killPreview(projectId: string): Promise<void> {
  const h = registry().get(projectId);
  if (!h) return;
  registry().delete(projectId);
  try {
    await h.kill();
  } catch {
    /* already dead */
  }
}
