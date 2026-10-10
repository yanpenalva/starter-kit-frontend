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
  readonly status: number | null;
  readonly message: string;
}

export interface MappedStatusHttpError extends HttpErrorBase {
  readonly kind: Exclude<MappedStatusKind, "forbidden">;
  readonly status: number;
}

export type BlockedAccountReason = "pending_approval" | "suspended";

export interface ForbiddenHttpError extends HttpErrorBase {
  readonly kind: "forbidden";
  readonly status: 403;
  readonly blockedReason: BlockedAccountReason | null;
  readonly blockedEmailVerifiedAt: string | null;
}

export interface ValidationHttpError extends HttpErrorBase {
  readonly kind: "validation";
  readonly status: 422;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
}

export interface RateLimitedHttpError extends HttpErrorBase {
  readonly kind: "rate_limited";
  readonly status: 429;
  readonly retryAfterSeconds: number | null;
}

export interface TransportHttpError extends HttpErrorBase {
  readonly kind: TransportKind;
  readonly status: number | null;
  readonly timedOut: boolean;
}

export type HttpError =
  | MappedStatusHttpError
  | ForbiddenHttpError
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
