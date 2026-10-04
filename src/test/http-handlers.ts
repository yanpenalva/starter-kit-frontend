/**
 * Shared MSW handlers for HTTP-transport tests.
 *
 * These handlers record every observed request (method, path, headers) so
 * tests can assert real request facts (ordering, CSRF header mirroring).
 * They simulate API responses only; cookie issuance by a real browser and
 * cross-origin behavior are real-API E2E concerns (SPA #17) and are never
 * claimed here.
 */

import { http, HttpResponse } from "msw";
import type { RequestHandler, ResponseResolver } from "msw";
import { CSRF_COOKIE_NAME } from "@/lib/http/config";

export const TEST_API_BASE = "http://localhost:8000";
export const TEST_CSRF_TOKEN = "test-csrf-token-value";
export const TEST_ECHO_PATH = "/api/v1/__test-echo";

export interface RecordedRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: Headers;
}

export interface RecordedHandlers {
  readonly handlers: readonly RequestHandler[];
  readonly calls: readonly RecordedRequest[];
}

export interface HandlerOptions {
  /** Status returned by the bootstrap endpoint. */
  readonly csrfStatus?: number;
  /** Status returned by the echo endpoint. */
  readonly echoStatus?: number;
  /** JSON body returned by the echo endpoint. */
  readonly echoBody?: unknown;
  /** Extra headers returned by the echo endpoint. */
  readonly echoHeaders?: Readonly<Record<string, string>>;
}

function recordCall(calls: RecordedRequest[], request: Request): void {
  const url = new URL(request.url);
  calls.push({
    method: request.method,
    path: `${url.pathname}${url.search}`,
    headers: request.headers,
  });
}

export function makeCorsHeaders(
  request: Request,
  extra?: Readonly<Record<string, string>>,
): Record<string, string> {
  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept,X-XSRF-TOKEN",
    "Access-Control-Expose-Headers": "Retry-After,Set-Cookie",
    ...(extra ?? {}),
  };
}

function echoResolver(
  calls: RecordedRequest[],
  options: HandlerOptions,
): ResponseResolver {
  return ({ request }) => {
    recordCall(calls, request);
    return HttpResponse.json(options.echoBody ?? null, {
      status: options.echoStatus ?? 200,
      headers: makeCorsHeaders(request, options.echoHeaders),
    });
  };
}

/**
 * Builds fresh handlers + a call log for one test. Usage:
 * `const test = createHttpTestHandlers(); server.use(...test.handlers);`
 */
export function createHttpTestHandlers(
  options: HandlerOptions = {},
): RecordedHandlers {
  const calls: RecordedRequest[] = [];
  const handlers: readonly RequestHandler[] = [
    http.options(
      "*",
      ({ request }) =>
        new HttpResponse(null, {
          status: 204,
          headers: makeCorsHeaders(request),
        }),
    ),
    http.get(`${TEST_API_BASE}/sanctum/csrf-cookie`, ({ request }) => {
      recordCall(calls, request);
      return new HttpResponse(null, {
        status: options.csrfStatus ?? 204,
        headers: makeCorsHeaders(request, {
          "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
        }),
      });
    }),
    http.post(
      `${TEST_API_BASE}${TEST_ECHO_PATH}`,
      echoResolver(calls, options),
    ),
    http.put(`${TEST_API_BASE}${TEST_ECHO_PATH}`, echoResolver(calls, options)),
    http.patch(
      `${TEST_API_BASE}${TEST_ECHO_PATH}`,
      echoResolver(calls, options),
    ),
    http.delete(
      `${TEST_API_BASE}${TEST_ECHO_PATH}`,
      echoResolver(calls, options),
    ),
    http.get(`${TEST_API_BASE}${TEST_ECHO_PATH}`, echoResolver(calls, options)),
  ];
  return { handlers, calls };
}
