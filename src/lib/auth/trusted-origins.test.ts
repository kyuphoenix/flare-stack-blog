import { describe, expect, it } from "vitest";
import {
  getAuthAllowedHosts,
  getAuthTrustedOrigins,
  isTrustedOrigin,
} from "./trusted-origins";

describe("auth trusted origins", () => {
  it("includes the canonical auth origin", () => {
    expect(
      getAuthTrustedOrigins("https://blog.example.com/api/auth", undefined),
    ).toEqual(["https://blog.example.com"]);
  });

  it("parses comma and whitespace separated origins", () => {
    expect(
      getAuthTrustedOrigins(
        "https://blog.example.com",
        "https://admin.example.com, preview.example.com\nlocalhost:3000",
      ),
    ).toEqual([
      "https://blog.example.com",
      "https://admin.example.com",
      "https://preview.example.com",
      "http://localhost:3000",
    ]);
  });

  it("derives allowed hosts for dynamic Better Auth base URLs", () => {
    expect(
      getAuthAllowedHosts(
        "https://blog.example.com",
        "https://admin.example.com, *.example.net localhost:3000",
      ),
    ).toEqual([
      "blog.example.com",
      "admin.example.com",
      "*.example.net",
      "localhost:3000",
    ]);
  });

  it("matches wildcard trusted origins", () => {
    const trustedOrigins = getAuthTrustedOrigins(
      "https://blog.example.com",
      "https://*.example.net",
    );

    expect(isTrustedOrigin("https://preview.example.net", trustedOrigins)).toBe(
      true,
    );
    expect(isTrustedOrigin("https://example.net", trustedOrigins)).toBe(false);
  });
});
