import { describe, expect, it, vi } from "vitest";
import * as ConfigService from "@/features/config/service/config.service";
import { getIsEmailConfigured } from "./auth.service";

function createContext(env: Partial<Env> = {}) {
  return {
    db: {} as DB,
    executionCtx: {} as ExecutionContext,
    env: {
      BETTER_AUTH_SECRET: "local-dev-secret-that-is-at-least-32-chars",
      BETTER_AUTH_URL: "http://localhost:3000",
      ADMIN_EMAIL: "admin@example.com",
      LOCALE: "zh",
      GITHUB_CLIENT_ID: "local-github-client-id",
      GITHUB_CLIENT_SECRET: "local-github-client-secret",
      CLOUDFLARE_ZONE_ID: "local-zone",
      CLOUDFLARE_PURGE_API_TOKEN: "local-token",
      DOMAIN: "example.com",
      ...env,
    } as Env,
  };
}

describe("getIsEmailConfigured", () => {
  it("enables email auth in local development without SMTP config", async () => {
    const getSystemConfig = vi.spyOn(ConfigService, "getSystemConfig");

    await expect(
      getIsEmailConfigured(createContext({ ENVIRONMENT: "dev" })),
    ).resolves.toBe(true);
    expect(getSystemConfig).not.toHaveBeenCalled();
  });

  it("requires SMTP config in production", async () => {
    vi.spyOn(ConfigService, "getSystemConfig").mockResolvedValueOnce(
      ConfigService.resolveSystemConfig(undefined),
    );

    await expect(
      getIsEmailConfigured(createContext({ ENVIRONMENT: "prod" })),
    ).resolves.toBe(false);
  });
});
