/**
 * Central HTTP client (ADR 0001, decision D9).
 *
 * One axios instance owns every SPA transport concern: credentials and the
 * CSRF header flow, a single named timeout, JSON negotiation, and mapping of
 * transport failures to typed `HttpError` values. Session state lives only in
 * HttpOnly cookies owned by the API: no Bearer/PAT headers, nothing in
 * localStorage/sessionStorage, and no mutation of axios global defaults.
 *
 * The factory enforces an immutable origin invariant: requests targeting
 * foreign origins, protocol-relative escapes, or overriding the base URL to
 * a foreign destination are rejected before CSRF bootstrap or network dispatch.
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
import {
  buildHttpError,
  HTTP_STATUS_SERVER_ERROR_MAX,
  HTTP_STATUS_SERVER_ERROR_MIN,
  isHttpError,
  STATUS_TO_KIND,
} from "./errors";
import type { HttpError, HttpErrorKind } from "./errors";

const MUTATING_METHODS: ReadonlySet<string> = new Set([
  "post",
  "put",
  "patch",
  "delete",
]);

const AXIOS_TIMEOUT_CODE = "ECONNABORTED";

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
  if (
    status >= HTTP_STATUS_SERVER_ERROR_MIN &&
    status <= HTTP_STATUS_SERVER_ERROR_MAX
  ) {
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

function combineUrls(baseURL: string, relativeURL: string): string {
  const cleanBase = baseURL.replace(/\/+$/, "");
  const cleanRelative = relativeURL.replace(/^\/+/, "");
  return `${cleanBase}/${cleanRelative}`;
}

function validateBaseUrlOverride(rawBase: string, trustedOrigin: string): void {
  if (rawBase === "") {
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(rawBase);
  } catch {
    throw buildHttpError({ kind: "unexpected" });
  }
  if (
    parsed.origin !== trustedOrigin ||
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw buildHttpError({ kind: "unexpected" });
  }
}

function validateAbsoluteUrl(rawUrl: string, trustedOrigin: string): boolean {
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(rawUrl)) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw buildHttpError({ kind: "unexpected" });
  }
  if (
    parsed.origin !== trustedOrigin ||
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw buildHttpError({ kind: "unexpected" });
  }
  return true;
}

function validateRelativeUrl(
  rawUrl: string,
  baseToUse: string,
  trustedOrigin: string,
): void {
  const combined = combineUrls(baseToUse, rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(combined, trustedOrigin);
  } catch {
    throw buildHttpError({ kind: "unexpected" });
  }
  if (
    parsed.origin !== trustedOrigin ||
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw buildHttpError({ kind: "unexpected" });
  }
}

function validateRequestOrigin(
  config: InternalAxiosRequestConfig,
  trustedBaseUrl: string,
  trustedOrigin: string,
): void {
  const rawUrl = typeof config.url === "string" ? config.url.trim() : "";
  const rawBase =
    typeof config.baseURL === "string" ? config.baseURL.trim() : "";

  if (
    rawUrl.startsWith("//") ||
    rawUrl.startsWith("\\\\") ||
    rawUrl.startsWith("/\\") ||
    rawUrl.startsWith("\\/") ||
    (rawUrl.startsWith("/") && rawUrl.includes("\\"))
  ) {
    throw buildHttpError({ kind: "unexpected" });
  }
  validateBaseUrlOverride(rawBase, trustedOrigin);
  if (validateAbsoluteUrl(rawUrl, trustedOrigin)) {
    return;
  }
  if (/^[a-z][a-z\d+\-.]*:/i.test(rawUrl)) {
    throw buildHttpError({ kind: "unexpected" });
  }
  const baseToUse = rawBase !== "" ? rawBase : trustedBaseUrl;
  validateRelativeUrl(rawUrl, baseToUse, trustedOrigin);
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
  const trustedUrl = new URL(validatedBaseUrl);
  const trustedOrigin = trustedUrl.origin;

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

  instance.interceptors.request.use((config) => {
    validateRequestOrigin(config, validatedBaseUrl, trustedOrigin);
    return attachCsrf(config, coordinator.ensureCsrfCookie);
  });
  instance.interceptors.response.use(undefined, (cause: unknown) =>
    rejectWithHttpError(cause, resetCsrfBootstrap),
  );

  return {
    instance,
    ensureCsrfCookie: coordinator.ensureCsrfCookie,
    resetCsrfBootstrap,
  };
}
