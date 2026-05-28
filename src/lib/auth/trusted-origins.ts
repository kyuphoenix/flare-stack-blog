const SEPARATOR = /[\s,]+/;
const HTTP_PROTOCOL_RE = /^https?:\/\//i;

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function splitEntries(value: string | null | undefined) {
  return unique(
    (value ?? "")
      .split(SEPARATOR)
      .map((entry) => trimTrailingSlash(entry.trim()))
      .filter(Boolean),
  );
}

function originFromUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return trimTrailingSlash(value);
  }
}

function hostFromOriginPattern(value: string) {
  const withoutProtocol = value.replace(HTTP_PROTOCOL_RE, "");
  return withoutProtocol.split("/")[0] ?? "";
}

function defaultProtocolForHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
}

function toOriginPattern(entry: string) {
  if (HTTP_PROTOCOL_RE.test(entry)) {
    return originFromUrl(entry);
  }

  return `${defaultProtocolForHost(entry)}://${entry}`;
}

function toHostPattern(entry: string) {
  return HTTP_PROTOCOL_RE.test(entry) ? hostFromOriginPattern(entry) : entry;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternToRegExp(pattern: string) {
  const escaped = escapeRegExp(trimTrailingSlash(pattern)).replace(
    /\\\*/g,
    "[^/]*",
  );
  return new RegExp(`^${escaped}$`, "i");
}

export function getAuthTrustedOrigins(
  baseURL: string,
  trustedOrigins: string | null | undefined,
) {
  return unique([
    originFromUrl(baseURL),
    ...splitEntries(trustedOrigins).map(toOriginPattern),
  ]);
}

export function getAuthAllowedHosts(
  baseURL: string,
  trustedOrigins: string | null | undefined,
) {
  const base = new URL(baseURL);
  return unique([
    base.host,
    base.hostname,
    ...splitEntries(trustedOrigins).map(toHostPattern),
  ]);
}

export function isTrustedOrigin(origin: string, trustedOrigins: string[]) {
  const normalizedOrigin = originFromUrl(origin);
  return trustedOrigins.some((trustedOrigin) =>
    patternToRegExp(trustedOrigin).test(normalizedOrigin),
  );
}
