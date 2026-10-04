/**
 * Stable facade for typed HTTP errors (ADR 0001, decision D9).
 *
 * Cohesive responsibilities are split across specialized sub-modules:
 * - `error-types.ts`: Discriminated union types and error interfaces.
 * - `error-constants.ts`: HTTP status boundaries and safe fixed messages.
 * - `error-parsers.ts`: Field error and Retry-After header parsing.
 * - `error-guards.ts`: Full variant validation and type narrowing guards.
 * - `error-builders.ts`: Fail-closed error construction.
 */

export type {
  HttpError,
  HttpErrorBase,
  HttpErrorInput,
  HttpErrorKind,
  MappedStatusHttpError,
  MappedStatusKind,
  RateLimitedHttpError,
  TransportHttpError,
  TransportKind,
  ValidationHttpError,
} from "./error-types";

export {
  HTTP_STATUS_MAX,
  HTTP_STATUS_MIN,
  HTTP_STATUS_SERVER_ERROR_MAX,
  HTTP_STATUS_SERVER_ERROR_MIN,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  MAX_RETRY_AFTER_SECONDS,
  SAFE_MESSAGES,
  STATUS_BY_KIND,
  STATUS_TO_KIND,
} from "./error-constants";

export {
  asRecord,
  isValidHttpStatus,
  parseFieldErrors,
  parseRetryAfterSeconds,
  resolveServerErrorStatus,
  toStringArray,
} from "./error-parsers";

export {
  isCsrfMismatchHttpError,
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
} from "./error-guards";

export { buildHttpError } from "./error-builders";
