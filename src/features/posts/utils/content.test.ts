import type { JSONContent } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { convertToPlainText } from "./content";

function doc(...content: Array<JSONContent>): JSONContent {
  return { type: "doc", content };
}

describe("convertToPlainText", () => {
  it("extracts visible text from html snippets", () => {
    const content = doc({
      type: "htmlSnippet",
      attrs: {
        html: `
          <section>
            <style>.hidden { display: none; }</style>
            <script>alert("nope")</script>
            <h2>Hello HTML</h2>
            <p>Snippet body</p>
          </section>
        `,
      },
    });

    expect(convertToPlainText(content)).toBe("Hello HTML Snippet body");
  });
});
