import { createHighlighter, type Highlighter } from "shiki";

const LANGS = [
  "tsx",
  "ts",
  "js",
  "jsx",
  "json",
  "json5",
  "html",
  "css",
  "bash",
  "sh",
  "shell",
  "md",
  "markdown",
  "diff",
  "yaml",
  "python",
  "txt",
] as const;

type Lang = (typeof LANGS)[number];

const THEME = "github-light";

let singleton: Promise<Highlighter> | undefined;

function highlighter(): Promise<Highlighter> {
  if (!singleton) {
    singleton = createHighlighter({
      themes: [THEME],
      langs: [...LANGS],
    });
  }
  return singleton;
}

function normalizeLang(lang: string | undefined): Lang {
  const candidate = (lang ?? "").toLowerCase();
  if ((LANGS as readonly string[]).includes(candidate)) return candidate as Lang;
  return "txt";
}

/**
 * Highlight a code snippet into SSR-safe HTML. Falls back to `txt` when the
 * language isn't one we pre-loaded, so the caller never crashes on unknown
 * extensions.
 */
export async function highlightCode(
  code: string,
  lang?: string,
): Promise<string> {
  const hl = await highlighter();
  return hl.codeToHtml(code, { lang: normalizeLang(lang), theme: THEME });
}
