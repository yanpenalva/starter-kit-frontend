/**
 * Typed error contracts (ADR 0001, decision D9).
 * Pure interface and type declarations without runtime function nodes.
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

export interface HttpErrorInput {
  readonly kind: HttpErrorKind;
  readonly status?: number | null;
  readonly retryAfterHeader?: string | null;
  readonly body?: unknown;
  readonly timedOut?: boolean;
}
