// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { normalizeRedirectUrl } from "./normalize-redirect-url";

vi.mock("@/lib/env/client.env", () => ({
  clientEnv: () => ({
    VITE_AUTH_TRUSTED_ORIGINS: "https://accounts.example.com",
  }),
}));

describe("normalizeRedirectUrl", () => {
  it("falls back when redirect target is untrusted", () => {
    expect(normalizeRedirectUrl("https://evil.example.com/admin", "/")).toBe(
      `${window.location.origin}/`,
    );
  });

  it("keeps same-origin api redirects relative", () => {
    expect(normalizeRedirectUrl("/api/auth/callback?code=abc", "/")).toBe(
      "/api/auth/callback?code=abc",
    );
  });

  it("preserves trusted external api redirects as absolute URLs", () => {
    expect(
      normalizeRedirectUrl("https://accounts.example.com/api/callback", "/"),
    ).toBe("https://accounts.example.com/api/callback");
  });
});
