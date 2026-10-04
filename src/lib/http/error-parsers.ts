/**
 * Safe metadata and status parsers for HTTP transport responses.
 */

import {
  HTTP_STATUS_MAX,
  HTTP_STATUS_MIN,
  HTTP_STATUS_SERVER_ERROR_MAX,
  HTTP_STATUS_SERVER_ERROR_MIN,
  MAX_RETRY_AFTER_SECONDS,
} from "./error-constants";

const SECONDS_PATTERN = /^[0-9]+$/;
const IMF_FIXDATE_PATTERN =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(\d{2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT$/i;

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function toStringArray(value: unknown): readonly string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    const list: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (typeof item === "string") {
        list.push(item);
      }
    }
    return list;
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
  const match = IMF_FIXDATE_PATTERN.exec(value);
  if (match === null) {
    return null;
  }
  const expectedDay = Number.parseInt(match[1] as string, 10);
  const when = Date.parse(value);
  if (Number.isNaN(when) || new Date(when).getUTCDate() !== expectedDay) {
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

export function resolveServerErrorStatus(
  reportedStatus: number | null,
): number {
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

export function isValidHttpStatus(status: unknown): boolean {
  return (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= HTTP_STATUS_MIN &&
    status <= HTTP_STATUS_MAX
  );
}
