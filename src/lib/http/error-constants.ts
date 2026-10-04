/**
 * Pure constant mappings and status boundaries for HTTP transport errors.
 */

import type { HttpErrorKind, MappedStatusKind } from "./error-types";

export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
export const HTTP_STATUS_MIN = 100;
export const HTTP_STATUS_MAX = 599;
export const HTTP_STATUS_SERVER_ERROR_MIN = 500;
export const HTTP_STATUS_SERVER_ERROR_MAX = 599;
export const MAX_RETRY_AFTER_SECONDS = 31_536_000;

export const STATUS_BY_KIND: Readonly<Record<MappedStatusKind, number>> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  csrf_mismatch: 419,
  server_error: 500,
};

export const STATUS_TO_KIND: Readonly<Record<number, HttpErrorKind>> = {
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  419: "csrf_mismatch",
  422: "validation",
  429: "rate_limited",
  500: "server_error",
};

export const SAFE_MESSAGES: Readonly<Record<HttpErrorKind, string>> = {
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

export const KNOWN_KINDS_SET: ReadonlySet<string> = new Set(
  Object.keys(SAFE_MESSAGES),
);
