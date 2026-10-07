import {
  HTTP_STATUS_SERVER_ERROR_MAX,
  HTTP_STATUS_SERVER_ERROR_MIN,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  KNOWN_KINDS_SET,
  MAX_RETRY_AFTER_SECONDS,
  SAFE_MESSAGES,
  STATUS_BY_KIND,
} from "./error-constants";
import { asRecord, isValidHttpStatus } from "./error-parsers";
import type {
  HttpError,
  HttpErrorKind,
  MappedStatusHttpError,
  MappedStatusKind,
  RateLimitedHttpError,
  ValidationHttpError,
} from "./error-types";
const hasOnlyStrings = (messages: readonly unknown[]): boolean => {
  for (let index = 0; index < messages.length; index += 1) {
    if (typeof messages[index] !== "string") {
      return false;
    }
  }
  return true;
};
const isFieldErrorsRecord = (value: unknown): boolean => {
  const record = asRecord(value);
  if (record === null) {
    return false;
  }
  for (const messages of Object.values(record)) {
    if (!Array.isArray(messages) || !hasOnlyStrings(messages)) {
      return false;
    }
  }
  return true;
};
const isValidRetryAfter = (value: unknown): boolean => {
  if (value === null) {
    return true;
  }
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_RETRY_AFTER_SECONDS
  );
};
const validateStatusKind = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): boolean => {
  if (kind === "server_error") {
    return (
      typeof rec["status"] === "number" &&
      Number.isInteger(rec["status"]) &&
      rec["status"] >= HTTP_STATUS_SERVER_ERROR_MIN &&
      rec["status"] <= HTTP_STATUS_SERVER_ERROR_MAX &&
      rec["message"] === SAFE_MESSAGES.server_error
    );
  }
  const expectedStatus = STATUS_BY_KIND[kind as MappedStatusKind];
  return (
    rec["status"] === expectedStatus && rec["message"] === SAFE_MESSAGES[kind]
  );
};
const validatePayloadKind = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): boolean => {
  if (kind === "validation") {
    return (
      rec["status"] === HTTP_STATUS_UNPROCESSABLE_ENTITY &&
      rec["message"] === SAFE_MESSAGES.validation &&
      isFieldErrorsRecord(rec["fieldErrors"])
    );
  }
  return (
    rec["status"] === HTTP_STATUS_TOO_MANY_REQUESTS &&
    rec["message"] === SAFE_MESSAGES.rate_limited &&
    isValidRetryAfter(rec["retryAfterSeconds"])
  );
};
const validateTransportKind = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): boolean => {
  if (kind === "network") {
    return (
      rec["status"] === null &&
      rec["message"] === SAFE_MESSAGES.network &&
      typeof rec["timedOut"] === "boolean"
    );
  }
  if (kind === "cancelled") {
    return (
      rec["status"] === null &&
      rec["message"] === SAFE_MESSAGES.cancelled &&
      rec["timedOut"] === false
    );
  }
  return (
    (rec["status"] === null || isValidHttpStatus(rec["status"])) &&
    rec["message"] === SAFE_MESSAGES.unexpected &&
    rec["timedOut"] === false
  );
};
const validateVariant = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): boolean => {
  if (kind in STATUS_BY_KIND || kind === "server_error") {
    return validateStatusKind(kind, rec);
  }
  if (kind === "validation" || kind === "rate_limited") {
    return validatePayloadKind(kind, rec);
  }
  return validateTransportKind(kind, rec);
};
export const isHttpError = (value: unknown): value is HttpError => {
  const record = asRecord(value);
  if (record === null) {
    return false;
  }
  const kind = record["kind"];
  if (typeof kind !== "string" || !KNOWN_KINDS_SET.has(kind)) {
    return false;
  }
  return validateVariant(kind as HttpErrorKind, record);
};
export const isValidationHttpError = (
  value: unknown,
): value is ValidationHttpError => {
  return isHttpError(value) && value.kind === "validation";
};
export const isRateLimitedHttpError = (
  value: unknown,
): value is RateLimitedHttpError => {
  return isHttpError(value) && value.kind === "rate_limited";
};
export const isCsrfMismatchHttpError = (
  value: unknown,
): value is MappedStatusHttpError => {
  return isHttpError(value) && value.kind === "csrf_mismatch";
};
