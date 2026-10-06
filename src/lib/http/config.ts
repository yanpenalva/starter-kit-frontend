export const HTTP_TIMEOUT_MS = 15_000;
export const CSRF_COOKIE_PATH = "/sanctum/csrf-cookie";
export const CSRF_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

const HTTP_AUTHORITY_PATTERN = /^https?:\/\/[^/\s?#\\]+/;

const ENV_KEY_API_BASE_URL = "VITE_API_URL";
const ENV_KEY_APP_ENV = "VITE_APP_ENV";

export type AppEnvironment =
  "development" | "preview" | "staging" | "production";

export interface EnvironmentConfig {
  readonly environment: AppEnvironment;
  readonly apiBaseUrl: string;
}

export class InvalidApiBaseUrlError extends Error {
  public constructor(reason: string) {
    super(`Invalid ${ENV_KEY_API_BASE_URL}: ${reason}`);
    this.name = "InvalidApiBaseUrlError";
  }
}

export class InvalidEnvironmentConfigError extends Error {
  public constructor(reason: string) {
    super(`Invalid environment configuration: ${reason}`);
    this.name = "InvalidEnvironmentConfigError";
  }
}

const CONTROL_CHARACTER_MAX = 0x1f;
const DELETE_CHARACTER_CODE = 0x7f;

function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= CONTROL_CHARACTER_MAX || code === DELETE_CHARACTER_CODE) {
      return true;
    }
  }
  return false;
}

function parseApiBaseUrl(trimmedBase: string): URL {
  if (trimmedBase.includes("\\")) {
    throw new InvalidApiBaseUrlError("backslashes are not allowed in base URL");
  }
  if (!HTTP_AUTHORITY_PATTERN.test(trimmedBase)) {
    throw new InvalidApiBaseUrlError(
      "URL must start with http:// or https:// followed by authority",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmedBase);
  } catch {
    throw new InvalidApiBaseUrlError("value is not a valid URL");
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new InvalidApiBaseUrlError("protocol must be http or https");
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

export function resolveApiBaseUrl(rawBase: unknown): string {
  if (typeof rawBase !== "string") {
    throw new InvalidApiBaseUrlError("value is missing or empty");
  }
  if (hasControlCharacters(rawBase)) {
    throw new InvalidApiBaseUrlError("control characters are not allowed");
  }
  const trimmed = rawBase.trim();
  if (trimmed === "") {
    throw new InvalidApiBaseUrlError("value is missing or empty");
  }
  const parsed = parseApiBaseUrl(trimmed);
  const trimmedPath = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${trimmedPath}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function apiBaseUrlFromEnv(env: unknown): string {
  const record = asRecord(env);
  if (record === null) {
    throw new InvalidApiBaseUrlError("environment is not an object");
  }
  return resolveApiBaseUrl(record[ENV_KEY_API_BASE_URL]);
}

const VALID_ENVIRONMENTS: ReadonlySet<string> = new Set([
  "development",
  "preview",
  "staging",
  "production",
]);

export function resolveAppEnvironment(env: unknown): AppEnvironment {
  const record = asRecord(env);
  if (record === null) {
    return "development";
  }
  const rawEnv = record[ENV_KEY_APP_ENV];
  if (typeof rawEnv !== "string" || rawEnv.trim() === "") {
    return "development";
  }
  const normalized = rawEnv.trim().toLowerCase();
  if (!VALID_ENVIRONMENTS.has(normalized)) {
    throw new InvalidEnvironmentConfigError(`unknown environment: ${rawEnv}`);
  }
  return normalized as AppEnvironment;
}

const PRODUCTION_DOMAINS: readonly string[] = [
  "api.starterkit.com",
  "api.production.internal",
];

export function isProductionApiUrl(apiUrl: string): boolean {
  try {
    const parsed = new URL(apiUrl);
    const host = parsed.hostname.toLowerCase();
    if (PRODUCTION_DOMAINS.includes(host)) {
      return true;
    }
    const tokens = host.split(/[.-]/);
    return tokens.some((part) => part === "prod" || part === "production");
  } catch {
    return false;
  }
}

export function resolveEnvironmentConfig(env: unknown): EnvironmentConfig {
  const appEnv = resolveAppEnvironment(env);
  const apiBaseUrl = apiBaseUrlFromEnv(env);

  if (appEnv === "preview" && isProductionApiUrl(apiBaseUrl)) {
    throw new InvalidEnvironmentConfigError(
      "preview environment must never point to production API",
    );
  }

  return {
    environment: appEnv,
    apiBaseUrl,
  };
}
