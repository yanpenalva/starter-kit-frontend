/**
 * HTTP client configuration boundaries (ADR 0001, decisions D9/D10).
 *
 * The API base URL comes exclusively from the build-time environment
 * (`VITE_API_URL`, see `.env.example`). It is never accepted as a runtime or
 * user-controlled parameter: `resolveApiBaseUrl` fails closed on missing,
 * malformed or unsafe values instead of falling back to a permissive default.
 */

/** Request timeout for every call made through the central client. */
export const HTTP_TIMEOUT_MS = 15_000;

/** Sanctum SPA bootstrap endpoint that issues the XSRF cookie. */
export const CSRF_COOKIE_PATH = "/sanctum/csrf-cookie";

/** Cookie where Sanctum stores the CSRF token (Laravel default). */
export const CSRF_COOKIE_NAME = "XSRF-TOKEN";

/** Header the client mirrors the CSRF cookie value into (Laravel default). */
export const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

const ENV_KEY_API_BASE_URL = "VITE_API_URL";

/** Raised when the configured API base URL fails validation. */
export class InvalidApiBaseUrlError extends Error {
  public constructor(reason: string) {
    super(`Invalid ${ENV_KEY_API_BASE_URL}: ${reason}`);
    this.name = "InvalidApiBaseUrlError";
  }
}

function parseApiBaseUrl(rawBase: string): URL {
  if (rawBase.includes("\\")) {
    throw new InvalidApiBaseUrlError("backslashes are not allowed in base URL");
  }
  let parsed: URL;
  try {
    parsed = new URL(rawBase);
  } catch {
    throw new InvalidApiBaseUrlError("value is not a valid URL");
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new InvalidApiBaseUrlError(
      `protocol "${parsed.protocol}" is not allowed (use http or https)`,
    );
  }
  if (parsed.username !== "" || parsed.password !== "") {
    throw new InvalidApiBaseUrlError(
      "credentials embedded in the URL are not allowed",
    );
  }
  if (parsed.search !== "" || parsed.hash !== "") {
    throw new InvalidApiBaseUrlError("query string or fragment is not allowed");
  }
  return parsed;
}

/**
 * Validates a raw API base URL and returns the normalized form
 * (origin plus optional path, without a trailing slash).
 */
export function resolveApiBaseUrl(rawBase: unknown): string {
  if (typeof rawBase !== "string" || rawBase.trim() === "") {
    throw new InvalidApiBaseUrlError("value is missing or empty");
  }
  const parsed = parseApiBaseUrl(rawBase.trim());
  const trimmedPath = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${trimmedPath}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Resolves the API base URL from an environment object shaped like
 * `ImportMetaEnv`. Missing values fail closed; there is no default host.
 */
export function apiBaseUrlFromEnv(env: unknown): string {
  const record = asRecord(env);
  if (record === null) {
    throw new InvalidApiBaseUrlError("environment is not an object");
  }
  return resolveApiBaseUrl(record[ENV_KEY_API_BASE_URL]);
}
