/**
 * Typed, discriminated transport errors (ADR 0001, decision D9).
 *
 * Every failure surfaced by the central HTTP client is an `HttpError`.
 * Messages are fixed, safe strings per kind: raw response bodies are parsed
 * only for contract metadata (validation field errors) and never copied into
 * messages, logs or exceptions, so credentials or PII cannot leak.
 */

export type MappedStatusKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "csrf_mismatch"
  | "server_error";

export type TransportKind = "network" | "cancelled" | "unexpected";

export type HttpErrorKind =
  MappedStatusKind | "validation" | "rate_limited" | TransportKind;

export interface HttpErrorBase {
  readonly kind: HttpErrorKind;
  /** HTTP status when the failure came from a response; null otherwise. */
  readonly status: number | null;
  /** Fixed, safe human message for the kind; never raw server text. */
  readonly message: string;
}

export interface MappedStatusHttpError extends HttpErrorBase {
  readonly kind: MappedStatusKind;
  readonly status: number;
}

export interface ValidationHttpError extends HttpErrorBase {
  readonly kind: "validation";
  readonly status: 422;
  /** Field error metadata from the API contract (Laravel `errors` shape). */
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
}

export interface RateLimitedHttpError extends HttpErrorBase {
  readonly kind: "rate_limited";
  readonly status: 429;
  /** Parsed `Retry-After` (seconds or HTTP-date); null when absent/unparsable. */
  readonly retryAfterSeconds: number | null;
}

export interface TransportHttpError extends HttpErrorBase {
  readonly kind: TransportKind;
  /** Null for network/cancelled; carries the odd status for "unexpected". */
  readonly status: number | null;
  /** True only for `kind: "network"` when the request timed out. */
  readonly timedOut: boolean;
}

export type HttpError =
  | MappedStatusHttpError
  | ValidationHttpError
  | RateLimitedHttpError
  | TransportHttpError;

const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;
const HTTP_STATUS_SERVER_ERROR_MIN = 500;
const HTTP_STATUS_SERVER_ERROR_MAX = 599;
const MAX_RETRY_AFTER_SECONDS = 31_536_000;

const SECONDS_PATTERN = /^[0-9]+$/;
const IMF_FIXDATE_PATTERN =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT$/i;

/** Fixed safe messages; the only strings exposed by this module. */
const SAFE_MESSAGES: Readonly<Record<HttpErrorKind, string>> = {
  unauthorized: "Your session is not authenticated or has expired.",
  forbidden: "You are not allowed to perform this action.",
  not_found: "The requested resource was not found.",
  conflict: "The request conflicts with the current state of the resource.",
  csrf_mismatch:
    "Your security token expired and the action was not completed.",
  validation: "Some fields need your attention.",
  rate_limited: "Too many requests. Please wait before trying again.",
  server_error:
    "The service is temporarily unavailable. Please try again later.",
  network: "The service could not be reached. Check your connection.",
  cancelled: "The request was cancelled.",
  unexpected: "An unexpected response was received.",
};

export interface HttpErrorInput {
  readonly kind: HttpErrorKind;
  readonly status: number | null;
  readonly retryAfterHeader: string | null;
  readonly body: unknown;
  readonly timedOut: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): readonly string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

/** Parses the Laravel `errors` object out of an untrusted response body. */
export function parseFieldErrors(
  body: unknown,
): Readonly<Record<string, readonly string[]>> {
  const envelope = asRecord(body);
  if (envelope === null) {
    return {};
  }
  const errors = asRecord(envelope["errors"]);
  if (errors === null) {
    return {};
  }
  const result: Record<string, readonly string[]> = {};
  for (const [field, value] of Object.entries(errors)) {
    const messages = toStringArray(value);
    if (messages.length > 0) {
      result[field] = messages;
    }
  }
  return result;
}

function parseDelaySeconds(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isSafeInteger(parsed) && parsed <= MAX_RETRY_AFTER_SECONDS) {
    return parsed;
  }
  return null;
}

function parseHttpDate(value: string): number | null {
  if (!IMF_FIXDATE_PATTERN.test(value)) {
    return null;
  }
  const when = Date.parse(value);
  if (Number.isNaN(when)) {
    return null;
  }
  const delay = Math.max(0, Math.ceil((when - Date.now()) / 1000));
  return Number.isSafeInteger(delay) && delay <= MAX_RETRY_AFTER_SECONDS
    ? delay
    : null;
}

/** Parses `Retry-After` as delay-seconds or HTTP-date into seconds. */
export function parseRetryAfterSeconds(
  headerValue: string | null,
): number | null {
  if (headerValue === null) {
    return null;
  }
  const trimmed = headerValue.trim();
  if (SECONDS_PATTERN.test(trimmed)) {
    return parseDelaySeconds(trimmed);
  }
  return parseHttpDate(trimmed);
}

function resolveServerErrorStatus(reportedStatus: number | null): number {
  if (
    reportedStatus !== null &&
    Number.isInteger(reportedStatus) &&
    reportedStatus >= HTTP_STATUS_SERVER_ERROR_MIN &&
    reportedStatus <= HTTP_STATUS_SERVER_ERROR_MAX
  ) {
    return reportedStatus;
  }
  return HTTP_STATUS_SERVER_ERROR_MIN;
}

function isValidHttpStatus(status: unknown): boolean {
  return (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= HTTP_STATUS_MIN &&
    status <= HTTP_STATUS_MAX
  );
}

function isFieldErrorsRecord(value: unknown): boolean {
  const record = asRecord(value);
  if (record === null) {
    return false;
  }
  for (const messages of Object.values(record)) {
    if (
      !Array.isArray(messages) ||
      !messages.every((m) => typeof m === "string")
    ) {
      return false;
    }
  }
  return true;
}

function isValidRetryAfter(value: unknown): boolean {
  if (value === null) {
    return true;
  }
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_RETRY_AFTER_SECONDS
  );
}

const BUILDERS: Readonly<
  Record<HttpErrorKind, (input: HttpErrorInput) => HttpError>
> = {
  validation: (input) => ({
    kind: "validation",
    status: HTTP_STATUS_UNPROCESSABLE_ENTITY,
    message: SAFE_MESSAGES.validation,
    fieldErrors: parseFieldErrors(input.body),
  }),
  rate_limited: (input) => ({
    kind: "rate_limited",
    status: HTTP_STATUS_TOO_MANY_REQUESTS,
    message: SAFE_MESSAGES.rate_limited,
    retryAfterSeconds: parseRetryAfterSeconds(input.retryAfterHeader),
  }),
  unauthorized: () => ({
    kind: "unauthorized",
    status: 401,
    message: SAFE_MESSAGES.unauthorized,
  }),
  forbidden: () => ({
    kind: "forbidden",
    status: 403,
    message: SAFE_MESSAGES.forbidden,
  }),
  not_found: () => ({
    kind: "not_found",
    status: 404,
    message: SAFE_MESSAGES.not_found,
  }),
  conflict: () => ({
    kind: "conflict",
    status: 409,
    message: SAFE_MESSAGES.conflict,
  }),
  csrf_mismatch: () => ({
    kind: "csrf_mismatch",
    status: 419,
    message: SAFE_MESSAGES.csrf_mismatch,
  }),
  server_error: (input) => ({
    kind: "server_error",
    status: resolveServerErrorStatus(input.status),
    message: SAFE_MESSAGES.server_error,
  }),
  network: (input) => ({
    kind: "network",
    status: null,
    message: SAFE_MESSAGES.network,
    timedOut: input.timedOut,
  }),
  cancelled: () => ({
    kind: "cancelled",
    status: null,
    message: SAFE_MESSAGES.cancelled,
    timedOut: false,
  }),
  unexpected: (input) => ({
    kind: "unexpected",
    status: isValidHttpStatus(input.status) ? input.status : null,
    message: SAFE_MESSAGES.unexpected,
    timedOut: false,
  }),
};

/** Builds the discriminated error from transport facts already extracted. */
export function buildHttpError(input: HttpErrorInput): HttpError {
  const builder = BUILDERS[input.kind];
  return builder(input);
}

const VARIANT_VALIDATORS: Readonly<
  Record<HttpErrorKind, (rec: Record<string, unknown>) => boolean>
> = {
  unauthorized: (rec) =>
    rec["status"] === 401 && rec["message"] === SAFE_MESSAGES.unauthorized,
  forbidden: (rec) =>
    rec["status"] === 403 && rec["message"] === SAFE_MESSAGES.forbidden,
  not_found: (rec) =>
    rec["status"] === 404 && rec["message"] === SAFE_MESSAGES.not_found,
  conflict: (rec) =>
    rec["status"] === 409 && rec["message"] === SAFE_MESSAGES.conflict,
  csrf_mismatch: (rec) =>
    rec["status"] === 419 && rec["message"] === SAFE_MESSAGES.csrf_mismatch,
  server_error: (rec) =>
    typeof rec["status"] === "number" &&
    Number.isInteger(rec["status"]) &&
    rec["status"] >= HTTP_STATUS_SERVER_ERROR_MIN &&
    rec["status"] <= HTTP_STATUS_SERVER_ERROR_MAX &&
    rec["message"] === SAFE_MESSAGES.server_error,
  validation: (rec) =>
    rec["status"] === HTTP_STATUS_UNPROCESSABLE_ENTITY &&
    rec["message"] === SAFE_MESSAGES.validation &&
    isFieldErrorsRecord(rec["fieldErrors"]),
  rate_limited: (rec) =>
    rec["status"] === HTTP_STATUS_TOO_MANY_REQUESTS &&
    rec["message"] === SAFE_MESSAGES.rate_limited &&
    isValidRetryAfter(rec["retryAfterSeconds"]),
  network: (rec) =>
    rec["status"] === null &&
    rec["message"] === SAFE_MESSAGES.network &&
    typeof rec["timedOut"] === "boolean",
  cancelled: (rec) =>
    rec["status"] === null &&
    rec["message"] === SAFE_MESSAGES.cancelled &&
    rec["timedOut"] === false,
  unexpected: (rec) =>
    (rec["status"] === null || isValidHttpStatus(rec["status"])) &&
    rec["message"] === SAFE_MESSAGES.unexpected &&
    rec["timedOut"] === false,
};

const KNOWN_KINDS: ReadonlySet<string> = new Set(Object.keys(SAFE_MESSAGES));

/** Type guard narrowing `unknown` failures (e.g. caught throws) to HttpError. */
export function isHttpError(value: unknown): value is HttpError {
  const record = asRecord(value);
  if (record === null) {
    return false;
  }
  const kind = record["kind"];
  if (typeof kind !== "string" || !KNOWN_KINDS.has(kind)) {
    return false;
  }
  return VARIANT_VALIDATORS[kind as HttpErrorKind](record);
}

export function isValidationHttpError(
  value: unknown,
): value is ValidationHttpError {
  return isHttpError(value) && value.kind === "validation";
}

export function isRateLimitedHttpError(
  value: unknown,
): value is RateLimitedHttpError {
  return isHttpError(value) && value.kind === "rate_limited";
}

export function isCsrfMismatchHttpError(
  value: unknown,
): value is MappedStatusHttpError {
  return isHttpError(value) && value.kind === "csrf_mismatch";
}
