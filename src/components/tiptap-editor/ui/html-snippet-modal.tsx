import { ClientOnly } from "@tanstack/react-router";
import { CodeXml, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDelayUnmount } from "@/hooks/use-delay-unmount";

interface HtmlSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { html: string; height: number }) => void;
}

const DEFAULT_HEIGHT = 320;

const HtmlSnippetModalInternal: React.FC<HtmlSnippetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const shouldRender = useDelayUnmount(isOpen, 500);
  const [html, setHtml] = useState("");
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  useEffect(() => {
    if (!isOpen) return;
    setHtml("");
    setHeight(DEFAULT_HEIGHT);
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = html.trim();
    if (!trimmed) return;
    onSubmit({ html: trimmed, height });
  };

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6 transition-all duration-300 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-none border border-border bg-background shadow-2xl transition-all duration-300 ease-out ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-border bg-background text-foreground">
              <CodeXml size={14} />
            </div>
            <div className="flex flex-col">
              <span className="mb-1 font-mono text-xs uppercase leading-none tracking-widest text-muted-foreground">
                COMMAND
              </span>
              <span className="font-mono text-base font-bold uppercase tracking-wider text-foreground">
                Insert HTML Snippet
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground transition-colors hover:bg-muted/10 hover:text-foreground"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-background p-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              HTML
            </label>
            <textarea
              autoFocus
              spellCheck={false}
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              placeholder="<section>...</section>"
              className="min-h-80 w-full resize-y rounded-none border border-border bg-muted/10 px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Frame height
            </label>
            <input
              type="number"
              min={120}
              max={1200}
              value={height}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setHeight(Number.isFinite(next) ? next : DEFAULT_HEIGHT);
              }}
              className="h-10 w-32 rounded-none border border-border bg-background px-3 font-mono text-xs text-foreground outline-none transition-colors focus:border-foreground"
            />
          </div>

          <p className="border-l border-border/60 pl-4 font-mono text-[11px] leading-5 text-muted-foreground">
            The snippet is rendered in a sandboxed iframe on public pages.
            Scripts are intentionally blocked to protect the blog page.
          </p>
        </div>

        <div className="flex items-center justify-end gap-0 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-r border-border/50 px-6 py-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted/10 hover:text-foreground"
          >
            [ Cancel ]
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!html.trim()}
            className="flex-1 px-6 py-4 font-mono text-xs font-bold uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground"
          >
            [ Insert ]
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const HtmlSnippetModal: React.FC<HtmlSnippetModalProps> = (props) => {
  return (
    <ClientOnly>
      <HtmlSnippetModalInternal {...props} />
    </ClientOnly>
  );
};
