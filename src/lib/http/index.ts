/**
 * Public surface of the central HTTP module (`src/lib/http`).
 *
 * Scope: transport only (ADR 0001, D9/D10). Consumers (features, query
 * composables) import the client from here and own endpoint paths/payloads
 * exclusively from the API canonical contract once published (API #11/#13);
 * until then this module stays contract-free by design (no invented
 * endpoints, no speculative DTOs, no generator output).
 */

export {
  apiBaseUrlFromEnv,
  resolveApiBaseUrl,
  CSRF_COOKIE_NAME,
  CSRF_COOKIE_PATH,
  CSRF_HEADER_NAME,
  HTTP_TIMEOUT_MS,
  InvalidApiBaseUrlError,
} from "./config";
export { createCsrfCoordinator } from "./csrf";
export type { CsrfBootstrapper, CsrfCoordinator } from "./csrf";
export { createHttpClient } from "./client";
export type { HttpClient } from "./client";
export {
  buildHttpError,
  isCsrfMismatchHttpError,
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
  parseFieldErrors,
  parseRetryAfterSeconds,
} from "./errors";
export type {
  HttpError,
  HttpErrorKind,
  MappedStatusHttpError,
  MappedStatusKind,
  RateLimitedHttpError,
  TransportHttpError,
  TransportKind,
  ValidationHttpError,
} from "./errors";
