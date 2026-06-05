import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HtmlSnippetFrameProps {
  html: string;
  height?: number | string | null;
  className?: string;
  title?: string;
}

const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 1200;

export function normalizeHtmlSnippetHeight(
  value: number | string | null | undefined,
) {
  if (value == null) return DEFAULT_HEIGHT;
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (!Number.isFinite(parsed)) return DEFAULT_HEIGHT;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(parsed)));
}

export function buildHtmlSnippetSrcDoc(html: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      html,
      body {
        margin: 0;
        min-height: 100%;
        background: transparent;
      }

      body {
        box-sizing: border-box;
        overflow-wrap: anywhere;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      img,
      video,
      canvas,
      svg,
      iframe {
        max-width: 100%;
      }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

export function HtmlSnippetFrame({
  html,
  height,
  className,
  title = "HTML snippet",
}: HtmlSnippetFrameProps) {
  const normalizedHeight = normalizeHtmlSnippetHeight(height);
  const srcDoc = useMemo(() => buildHtmlSnippetSrcDoc(html), [html]);

  if (!html.trim()) {
    return null;
  }

  return (
    <iframe
      title={title}
      srcDoc={srcDoc}
      sandbox=""
      referrerPolicy="no-referrer"
      loading="lazy"
      className={cn(
        "block w-full rounded-sm border border-border/50 bg-transparent",
        className,
      )}
      style={{ height: normalizedHeight }}
    />
  );
}
