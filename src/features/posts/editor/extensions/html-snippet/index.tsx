import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { CodeXml } from "lucide-react";
import {
  HtmlSnippetFrame,
  normalizeHtmlSnippetHeight,
} from "@/components/content/html-snippet-frame";
import { m } from "@/paraglide/messages";

export interface HtmlSnippetAttributes {
  html: string;
  height?: number | string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlSnippet: {
      insertHtmlSnippet: (attrs: HtmlSnippetAttributes) => ReturnType;
    };
  }
}

function HtmlSnippetNodeView({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as HtmlSnippetAttributes;
  const html = attrs.html ?? "";
  const height = normalizeHtmlSnippetHeight(attrs.height);

  return (
    <NodeViewWrapper
      className="my-8 overflow-hidden rounded-sm border border-border/60 bg-muted/10"
      data-html-snippet-node
    >
      <div contentEditable={false}>
        <div className="flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <CodeXml size={14} />
            {m.editor_html_snippet_node_label()}
          </div>
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            {m.editor_html_snippet_node_height()}
            <input
              type="number"
              min={120}
              max={1200}
              value={height}
              onChange={(event) =>
                updateAttributes({
                  height: normalizeHtmlSnippetHeight(event.target.value),
                })
              }
              className="h-7 w-20 rounded-none border border-border/60 bg-background px-2 text-xs text-foreground outline-none focus:border-foreground"
            />
          </label>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <textarea
            value={html}
            onChange={(event) =>
              updateAttributes({
                html: event.target.value,
              })
            }
            spellCheck={false}
            className="min-h-80 resize-y border-0 border-b border-border/50 bg-background px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none placeholder:text-muted-foreground/40 lg:border-r lg:border-b-0"
            placeholder={m.editor_html_snippet_node_placeholder()}
          />
          <div className="bg-background/60 p-4">
            {html.trim() ? (
              <HtmlSnippetFrame
                html={html}
                height={height}
                className="bg-background"
                title={m.editor_html_snippet_preview_title()}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-sm border border-dashed border-border/60 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground/60"
                style={{ height }}
              >
                {m.editor_html_snippet_preview()}
              </div>
            )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const HtmlSnippetExtension = Node.create({
  name: "htmlSnippet",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-html") ?? "",
        renderHTML: (attributes) => ({
          "data-html": attributes.html,
        }),
      },
      height: {
        default: 320,
        parseHTML: (element) =>
          normalizeHtmlSnippetHeight(element.getAttribute("data-height")),
        renderHTML: (attributes) => ({
          "data-height": String(normalizeHtmlSnippetHeight(attributes.height)),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="html-snippet"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "html-snippet" }),
    ];
  },

  addCommands() {
    return {
      insertHtmlSnippet:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              html: attrs.html,
              height: normalizeHtmlSnippetHeight(attrs.height),
            },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlSnippetNodeView);
  },
});
