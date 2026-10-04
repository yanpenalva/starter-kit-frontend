/**
 * Central HTTP client (ADR 0001, decision D9).
 *
 * One axios instance owns every SPA transport concern: credentials and the
 * CSRF header flow, a single named timeout, JSON negotiation, and mapping of
 * transport failures to typed `HttpError` values. Session state lives only in
 * HttpOnly cookies owned by the API: no Bearer/PAT headers, nothing in
 * localStorage/sessionStorage, and no mutation of axios global defaults.
 *
 * 419 (CSRF mismatch) resets the bootstrap so the NEXT mutating request
 * re-bootstraps. The failed request itself is never retried here: a token
 * mismatch can mean session rotation, so retrying is an auth-flow decision
 * owned by later waves, not a blind transport retry.
 */

import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  HTTP_TIMEOUT_MS,
  resolveApiBaseUrl,
} from "./config";
import { createCsrfCoordinator } from "./csrf";
import type { CsrfBootstrapper, CsrfCoordinator } from "./csrf";
import { buildHttpError, isHttpError } from "./errors";
import type { HttpError, HttpErrorKind } from "./errors";

const MUTATING_METHODS: ReadonlySet<string> = new Set([
  "post",
  "put",
  "patch",
  "delete",
]);

const STATUS_TO_KIND: Readonly<Record<number, HttpErrorKind>> = {
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  419: "csrf_mismatch",
  422: "validation",
  429: "rate_limited",
  500: "server_error",
};

const AXIOS_TIMEOUT_CODE = "ECONNABORTED";
const SERVER_ERROR_FLOOR = 500;
const SERVER_ERROR_CEILING = 599;

export interface HttpClient {
  /** The single configured axios instance for the whole SPA. */
  readonly instance: AxiosInstance;
  readonly ensureCsrfCookie: CsrfBootstrapper;
  readonly resetCsrfBootstrap: () => void;
}

function classifyStatus(status: number | null): HttpErrorKind {
  if (status === null) {
    return "network";
  }
  if (status >= SERVER_ERROR_FLOOR && status <= SERVER_ERROR_CEILING) {
    return "server_error";
  }
  return STATUS_TO_KIND[status] ?? "unexpected";
}

function toSingleHeader(value: unknown): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate === "string") {
    return candidate;
  }
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return String(candidate);
  }
  return null;
}

function mapAxiosError(
  cause: AxiosError,
  resetCsrfBootstrap: () => void,
): HttpError {
  if (axios.isCancel(cause)) {
    return buildHttpError({
      kind: "cancelled",
      status: null,
      retryAfterHeader: null,
      body: null,
      timedOut: false,
    });
  }
  const status = cause.response?.status ?? null;
  const kind = classifyStatus(status);
  if (kind === "csrf_mismatch") {
    resetCsrfBootstrap();
  }
  return buildHttpError({
    kind,
    status,
    retryAfterHeader: toSingleHeader(cause.response?.headers?.["retry-after"]),
    body: cause.response?.data ?? null,
    timedOut: status === null && cause.code === AXIOS_TIMEOUT_CODE,
  });
}

function mapTransportError(
  cause: unknown,
  resetCsrfBootstrap: () => void,
): HttpError {
  if (isHttpError(cause)) {
    return cause;
  }
  if (!axios.isAxiosError(cause)) {
    return buildHttpError({
      kind: "unexpected",
      status: null,
      retryAfterHeader: null,
      body: null,
      timedOut: false,
    });
  }
  return mapAxiosError(cause, resetCsrfBootstrap);
}

async function attachCsrf(
  config: InternalAxiosRequestConfig,
  ensureCsrfCookie: CsrfBootstrapper,
): Promise<InternalAxiosRequestConfig> {
  const method = config.method?.toLowerCase() ?? "";
  if (MUTATING_METHODS.has(method)) {
    await ensureCsrfCookie();
  }
  return config;
}

function rejectWithHttpError(
  cause: unknown,
  resetCsrfBootstrap: () => void,
): Promise<AxiosResponse> {
  return Promise.reject(mapTransportError(cause, resetCsrfBootstrap));
}

/** Creates the SPA-wide HTTP client. Callers own exactly one instance. */
export function createHttpClient(baseURL: string): HttpClient {
  const validatedBaseUrl = resolveApiBaseUrl(baseURL);
  const instance: AxiosInstance = axios.create({
    baseURL: validatedBaseUrl,
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: CSRF_COOKIE_NAME,
    xsrfHeaderName: CSRF_HEADER_NAME,
    timeout: HTTP_TIMEOUT_MS,
    headers: { Accept: "application/json" },
  });
  const coordinator: CsrfCoordinator = createCsrfCoordinator(instance);
  const resetCsrfBootstrap = coordinator.resetCsrfBootstrap;

  instance.interceptors.request.use((config) =>
    attachCsrf(config, coordinator.ensureCsrfCookie),
  );
  instance.interceptors.response.use(undefined, (cause: unknown) =>
    rejectWithHttpError(cause, resetCsrfBootstrap),
  );

  return {
    instance,
    ensureCsrfCookie: coordinator.ensureCsrfCookie,
    resetCsrfBootstrap,
  };
}
