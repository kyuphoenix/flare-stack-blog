import {
  getAuthTrustedOrigins,
  isTrustedOrigin,
} from "@/lib/auth/trusted-origins";
import { clientEnv } from "@/lib/env/client.env";

function getTrustedRedirectOrigins() {
  return getAuthTrustedOrigins(
    window.location.origin,
    clientEnv().VITE_AUTH_TRUSTED_ORIGINS,
  );
}

export function normalizeRedirectUrl(
  redirectTo: string | undefined,
  fallback: string,
) {
  const safeFallback = `${window.location.origin}${fallback}`;

  if (!redirectTo) {
    return safeFallback;
  }

  try {
    const normalizedUrl = new URL(redirectTo, window.location.origin);
    const isSameOrigin = normalizedUrl.origin === window.location.origin;
    const isAllowedExternalOrigin = isTrustedOrigin(
      normalizedUrl.origin,
      getTrustedRedirectOrigins(),
    );

    if (!isSameOrigin && !isAllowedExternalOrigin) {
      return safeFallback;
    }

    if (isSameOrigin && normalizedUrl.pathname.startsWith("/api/")) {
      return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`;
    }

    return normalizedUrl.toString();
  } catch {
    return safeFallback;
  }
}
