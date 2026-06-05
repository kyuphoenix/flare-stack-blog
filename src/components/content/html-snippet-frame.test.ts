import { describe, expect, it } from "vitest";
import {
  buildHtmlSnippetSrcDoc,
  normalizeHtmlSnippetHeight,
} from "./html-snippet-frame";

describe("normalizeHtmlSnippetHeight", () => {
  it("clamps invalid and out-of-range heights", () => {
    expect(normalizeHtmlSnippetHeight(null)).toBe(320);
    expect(normalizeHtmlSnippetHeight("20")).toBe(120);
    expect(normalizeHtmlSnippetHeight(2000)).toBe(1200);
    expect(normalizeHtmlSnippetHeight("480")).toBe(480);
  });
});

describe("buildHtmlSnippetSrcDoc", () => {
  it("wraps snippet html in an isolated document", () => {
    const srcDoc = buildHtmlSnippetSrcDoc("<div>Hello</div>");

    expect(srcDoc).toContain("<!doctype html>");
    expect(srcDoc).toContain('<base target="_blank" />');
    expect(srcDoc).toContain("<body><div>Hello</div></body>");
  });
});
