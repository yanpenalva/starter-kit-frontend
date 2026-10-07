import {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  KNOWN_KINDS_SET,
  SAFE_MESSAGES,
  STATUS_BY_KIND,
} from "./error-constants";
import {
  asRecord,
  isValidHttpStatus,
  parseFieldErrors,
  parseRetryAfterSeconds,
  resolveServerErrorStatus,
} from "./error-parsers";
import type { HttpError, HttpErrorKind, MappedStatusKind } from "./error-types";
const buildUnexpectedError = (statusCandidate: unknown): HttpError => {
  const status = isValidHttpStatus(statusCandidate)
    ? (statusCandidate as number)
    : null;
  return {
    kind: "unexpected",
    status,
    message: SAFE_MESSAGES.unexpected,
    timedOut: false,
  };
};
const buildStatusError = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): HttpError => {
  if (kind === "server_error") {
    const rawStatus = typeof rec["status"] === "number" ? rec["status"] : null;
    return {
      kind: "server_error",
      status: resolveServerErrorStatus(rawStatus),
      message: SAFE_MESSAGES.server_error,
    };
  }
  const status = STATUS_BY_KIND[kind as MappedStatusKind];
  return {
    kind: kind as MappedStatusKind,
    status,
    message: SAFE_MESSAGES[kind],
  };
};
const buildCustomPayloadError = (
  kind: "validation" | "rate_limited",
  rec: Record<string, unknown>,
): HttpError => {
  if (kind === "validation") {
    return {
      kind: "validation",
      status: HTTP_STATUS_UNPROCESSABLE_ENTITY,
      message: SAFE_MESSAGES.validation,
      fieldErrors: parseFieldErrors(rec["body"]),
    };
  }
  const rawHeader =
    typeof rec["retryAfterHeader"] === "string"
      ? rec["retryAfterHeader"]
      : null;
  return {
    kind: "rate_limited",
    status: HTTP_STATUS_TOO_MANY_REQUESTS,
    message: SAFE_MESSAGES.rate_limited,
    retryAfterSeconds: parseRetryAfterSeconds(rawHeader),
  };
};
const buildTransportKindError = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): HttpError => {
  if (kind === "network") {
    const timedOut =
      typeof rec["timedOut"] === "boolean" ? rec["timedOut"] : false;
    return {
      kind: "network",
      status: null,
      message: SAFE_MESSAGES.network,
      timedOut,
    };
  }
  if (kind === "cancelled") {
    return {
      kind: "cancelled",
      status: null,
      message: SAFE_MESSAGES.cancelled,
      timedOut: false,
    };
  }
  return buildUnexpectedError(rec["status"]);
};
const dispatchBuild = (
  kind: HttpErrorKind,
  rec: Record<string, unknown>,
): HttpError => {
  if (kind in STATUS_BY_KIND || kind === "server_error") {
    return buildStatusError(kind, rec);
  }
  if (kind === "validation" || kind === "rate_limited") {
    return buildCustomPayloadError(kind, rec);
  }
  return buildTransportKindError(kind, rec);
};
export const buildHttpError = (input: unknown): HttpError => {
  const record = asRecord(input);
  if (record === null) {
    return buildUnexpectedError(null);
  }
  const kind = record["kind"];
  if (typeof kind !== "string" || !KNOWN_KINDS_SET.has(kind)) {
    return buildUnexpectedError(record["status"]);
  }
  return dispatchBuild(kind as HttpErrorKind, record);
};
