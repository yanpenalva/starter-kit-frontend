/**
 * Transport tests for the central HTTP client (MSW-driven).
 *
 * What is proven here: axios wiring (credentials/XSRF config, header
 * mirroring, bootstrap ordering/dedup, typed error mapping, Retry-After and
 * validation metadata parsing, safe messages). What is NOT claimed: real
 * browser cookie issuance or cross-origin session behavior — those require
 * real-API E2E (SPA #17) and are explicitly out of scope.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  createHttpTestHandlers,
  makeCorsHeaders,
  TEST_API_BASE,
  TEST_CSRF_TOKEN,
  TEST_ECHO_PATH,
} from "@/test/http-handlers";
import {
  apiBaseUrlFromEnv,
  createHttpClient,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  HTTP_TIMEOUT_MS,
  InvalidApiBaseUrlError,
  isCsrfMismatchHttpError,
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
  parseFieldErrors,
  parseRetryAfterSeconds,
  resolveApiBaseUrl,
} from "@/lib/http";
import type { HttpClient } from "@/lib/http";

const ECHO_URL = `${TEST_API_BASE}${TEST_ECHO_PATH}`;
const CSRF_COOKIE_URL = `${TEST_API_BASE}/sanctum/csrf-cookie`;

const CSRF_CALLS = (calls: readonly { path: string }[]) =>
  calls.filter((call) => call.path === "/sanctum/csrf-cookie");
const ECHO_CALLS = (calls: readonly { path: string }[]) =>
  calls.filter((call) => call.path === TEST_ECHO_PATH);
const PII_PROBE = "internal-user.maria@example.com";

function useFreshHandlers(): ReturnType<typeof createHttpTestHandlers> {
  const recorded = createHttpTestHandlers();
  server.use(...recorded.handlers);
  return recorded;
}

function setErrorEcho(
  status: number,
  body?: unknown,
  headers?: Record<string, string>,
): void {
  server.use(
    http.post(ECHO_URL, ({ request }) =>
      HttpResponse.json(body ?? null, {
        status,
        headers: makeCorsHeaders(request, headers),
      }),
    ),
  );
}

async function rejectedPost(
  client: HttpClient,
  url: string = ECHO_URL,
  options: { timeout?: number; signal?: AbortSignal } = {},
): Promise<unknown> {
  try {
    await client.instance.post(url, {}, options);
  } catch (cause: unknown) {
    return cause;
  }
  throw new Error("request unexpectedly succeeded");
}

function describeCause(cause: unknown): string {
  if (typeof cause !== "object" || cause === null) {
    return String(cause);
  }
  const probe = cause as Record<string, unknown>;
  return JSON.stringify({
    name: probe["name"],
    message: probe["message"],
    code: probe["code"],
    isAxiosError: probe["isAxiosError"],
    kind: probe["kind"],
    status: probe["status"],
  });
}

function expectKind(cause: unknown, kind: string, status: number | null): void {
  if (!isHttpError(cause)) {
    throw new Error(`expected an HttpError, got: ${describeCause(cause)}`);
  }
  expect(cause.kind).toBe(kind);
  expect(cause.status).toBe(status);
}

describe("http client configuration", () => {
  it("keeps all transport concerns on the instance, never on axios globals", () => {
    const client = createHttpClient(TEST_API_BASE);
    expect(client.instance.defaults.baseURL).toBe(TEST_API_BASE);
    expect(client.instance.defaults.withCredentials).toBe(true);
    expect(client.instance.defaults.withXSRFToken).toBe(true);
    expect(client.instance.defaults.xsrfCookieName).toBe(CSRF_COOKIE_NAME);
    expect(client.instance.defaults.xsrfHeaderName).toBe(CSRF_HEADER_NAME);
    expect(client.instance.defaults.timeout).toBe(HTTP_TIMEOUT_MS);
    expect(
      client.instance.defaults.headers.common.Authorization,
    ).toBeUndefined();
    expect(client.instance.defaults.headers.common.Accept).toContain(
      "application/json",
    );
    expect(axios.defaults.withCredentials).not.toBe(true);
    expect(axios.defaults.headers.common.Authorization).toBeUndefined();
  });
});

describe("csrf bootstrap flow", () => {
  afterEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; path=/`;
  });

  it("bootstraps the CSRF cookie before a mutating request, not before GET", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);

    await client.instance.post(TEST_ECHO_PATH, {});
    await client.instance.get(TEST_ECHO_PATH);

    expect(test.calls[0]?.path).toBe("/sanctum/csrf-cookie");
    expect(CSRF_CALLS(test.calls)).toHaveLength(1);
    expect(ECHO_CALLS(test.calls)).toHaveLength(2);
  });

  it("bootstraps before all supported mutating methods: POST, PUT, PATCH, DELETE", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);

    await client.instance.post(TEST_ECHO_PATH, {});
    client.resetCsrfBootstrap();
    await client.instance.put(TEST_ECHO_PATH, {});
    client.resetCsrfBootstrap();
    await client.instance.patch(TEST_ECHO_PATH, {});
    client.resetCsrfBootstrap();
    await client.instance.delete(TEST_ECHO_PATH);

    expect(CSRF_CALLS(test.calls)).toHaveLength(4);
  });

  it("deduplicates concurrent bootstrap calls into one", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);

    await Promise.all([
      client.instance.post(TEST_ECHO_PATH, {}),
      client.instance.post(TEST_ECHO_PATH, {}),
      client.instance.post(TEST_ECHO_PATH, {}),
    ]);

    expect(CSRF_CALLS(test.calls)).toHaveLength(1);
    expect(ECHO_CALLS(test.calls)).toHaveLength(3);
  });

  it("caches successful bootstrap across sequential mutating requests until reset", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);

    await client.instance.post(TEST_ECHO_PATH, {});
    await client.instance.post(TEST_ECHO_PATH, {});

    expect(CSRF_CALLS(test.calls)).toHaveLength(1);
    expect(ECHO_CALLS(test.calls)).toHaveLength(2);
  });

  it("clears cache on bootstrap failure and does not execute the mutating request", async () => {
    let csrfStatus = 500;
    const test = createHttpTestHandlers();
    server.use(...test.handlers);
    server.use(
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: csrfStatus,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
    );
    const client = createHttpClient(TEST_API_BASE);

    const cause = await rejectedPost(client);
    expectKind(cause, "server_error", 500);
    expect(ECHO_CALLS(test.calls)).toHaveLength(0);

    // Verify recovery: subsequent request re-attempts bootstrap and succeeds when CSRF endpoint recovers
    csrfStatus = 204;
    await client.instance.post(TEST_ECHO_PATH, {});
    expect(ECHO_CALLS(test.calls)).toHaveLength(1);
  });

  it("handles reset during an inflight bootstrap without stale failure clearing newer generation", async () => {
    useFreshHandlers();
    let markFirstCallReceived!: () => void;
    const firstCallReceived = new Promise<void>((resolve) => {
      markFirstCallReceived = resolve;
    });

    let failFirstCsrf!: () => void;
    const firstCsrfDeferred = new Promise<Response>((resolve) => {
      failFirstCsrf = () =>
        resolve(
          new HttpResponse(null, {
            status: 500,
            headers: makeCorsHeaders(new Request(CSRF_COOKIE_URL)),
          }),
        );
    });

    let callCount = 0;
    server.use(
      http.get(CSRF_COOKIE_URL, ({ request }) => {
        callCount += 1;
        if (callCount === 1) {
          markFirstCallReceived();
          return firstCsrfDeferred;
        }
        return new HttpResponse(null, {
          status: 204,
          headers: makeCorsHeaders(request, {
            "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
          }),
        });
      }),
    );

    const client = createHttpClient(TEST_API_BASE);

    // Launch first mutation which triggers first bootstrap
    const firstMutation = client.instance.post(TEST_ECHO_PATH, {});

    // Wait until the first CSRF GET has genuinely reached the handler
    await firstCallReceived;

    // Explicitly reset bootstrap while first is inflight
    client.resetCsrfBootstrap();

    // Launch second mutation which initiates second bootstrap generation
    const secondMutation = client.instance.post(TEST_ECHO_PATH, {});

    // Now fail the first bootstrap
    failFirstCsrf();

    // First mutation rejected due to 500 bootstrap failure
    await expect(firstMutation).rejects.toThrow();

    // Second mutation should succeed
    await expect(secondMutation).resolves.toBeDefined();

    // Verify subsequent mutation reuses the successful second generation
    await client.instance.post(TEST_ECHO_PATH, {});
    expect(callCount).toBe(2);
  });

  it("mirrors the XSRF cookie into the request header", async () => {
    const test = useFreshHandlers();
    document.cookie = `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; path=/`;
    const client = createHttpClient(TEST_API_BASE);

    await client.instance.post(TEST_ECHO_PATH, {});

    expect(test.calls.at(-1)?.headers.get(CSRF_HEADER_NAME)).toBe(
      TEST_CSRF_TOKEN,
    );
  });

  it("resets bootstrap on 419 and surfaces csrf_mismatch without retrying, re-bootstrapping on next invocation", async () => {
    let echoStatus = 419;
    let csrfCalls = 0;
    let echoCalls = 0;

    server.use(
      http.options(
        "*",
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
      http.get(CSRF_COOKIE_URL, ({ request }) => {
        csrfCalls += 1;
        return new HttpResponse(null, {
          status: 204,
          headers: makeCorsHeaders(request, {
            "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
          }),
        });
      }),
      http.post(ECHO_URL, ({ request }) => {
        echoCalls += 1;
        return HttpResponse.json(echoStatus === 200 ? { ok: true } : null, {
          status: echoStatus,
          headers: makeCorsHeaders(request),
        });
      }),
    );

    const client = createHttpClient(TEST_API_BASE);

    const cause = await rejectedPost(client);
    expectKind(cause, "csrf_mismatch", 419);
    expect(echoCalls).toBe(1);
    expect(csrfCalls).toBe(1);

    // Restore echo endpoint to 200 OK
    echoStatus = 200;

    // Subsequent request re-bootstraps CSRF on same client and succeeds
    await client.instance.post(TEST_ECHO_PATH, {});
    expect(csrfCalls).toBe(2);
    expect(echoCalls).toBe(2);
  });
});

describe("typed error mapping", () => {
  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [409, "conflict"],
    [500, "server_error"],
    [502, "server_error"],
    [503, "server_error"],
    [504, "server_error"],
  ])("maps %i to kind %s", async (status, kind) => {
    useFreshHandlers();
    setErrorEcho(status);
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    expectKind(cause, kind, status);
  });

  it("maps unmapped statuses to unexpected with status code", async () => {
    useFreshHandlers();
    setErrorEcho(418);
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    expectKind(cause, "unexpected", 418);
  });

  it("maps out-of-bounds statuses (>599 or <100) to unexpected with null status", async () => {
    useFreshHandlers();
    setErrorEcho(650);
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    expectKind(cause, "unexpected", null);
  });

  it("maps network failures with timedOut=false", async () => {
    useFreshHandlers();
    server.use(http.post(ECHO_URL, () => HttpResponse.error()));
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    expectKind(cause, "network", null);
    if (isHttpError(cause) && cause.kind === "network") {
      expect(cause.timedOut).toBe(false);
      return;
    }
    throw new Error("expected a network HttpError");
  });

  it("marks aborted requests as timed out when code is ECONNABORTED", async () => {
    useFreshHandlers();
    server.use(
      http.post(ECHO_URL, async ({ request }) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(null, {
          status: 200,
          headers: makeCorsHeaders(request),
        });
      }),
    );
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client, ECHO_URL, { timeout: 20 });
    if (isHttpError(cause) && cause.kind === "network") {
      expect(cause.timedOut).toBe(true);
      return;
    }
    throw new Error(
      `expected a timed-out network HttpError, got: ${String(cause)}`,
    );
  });

  it("maps cancelled requests to kind cancelled", async () => {
    useFreshHandlers();
    const controller = new AbortController();
    server.use(
      http.post(ECHO_URL, async ({ request }) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(null, {
          status: 200,
          headers: makeCorsHeaders(request),
        });
      }),
    );
    const client = createHttpClient(TEST_API_BASE);
    const promise = client.instance.post(
      ECHO_URL,
      {},
      { signal: controller.signal },
    );
    controller.abort();
    let cause: unknown;
    try {
      await promise;
    } catch (err: unknown) {
      cause = err;
    }
    expectKind(cause, "cancelled", null);
  });

  it("parses Retry-After delay-seconds into metadata", async () => {
    useFreshHandlers();
    setErrorEcho(429, null, { "Retry-After": "8" });
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isHttpError(cause) && cause.kind === "rate_limited") {
      expect(cause.retryAfterSeconds).toBe(8);
      return;
    }
    throw new Error(`expected a rate_limited HttpError, got: ${String(cause)}`);
  });

  it("parses Retry-After IMF-fixdate HTTP-date deterministically into seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
    try {
      const parsed = parseRetryAfterSeconds("Sun, 04 Oct 2026 12:02:00 GMT");
      expect(parsed).toBe(120);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns null for malformed or overflow Retry-After headers", () => {
    expect(parseRetryAfterSeconds(null)).toBeNull();
    expect(parseRetryAfterSeconds("-1")).toBeNull();
    expect(parseRetryAfterSeconds("invalid-date")).toBeNull();
    expect(parseRetryAfterSeconds("99999999999999999999999")).toBeNull();
  });

  it("yields null retryAfterSeconds when Retry-After is absent", async () => {
    useFreshHandlers();
    setErrorEcho(429);
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isHttpError(cause) && cause.kind === "rate_limited") {
      expect(cause.retryAfterSeconds).toBeNull();
      return;
    }
    throw new Error(`expected a rate_limited HttpError, got: ${String(cause)}`);
  });

  it("parses 422 field errors through unknown-bound guards", async () => {
    useFreshHandlers();
    setErrorEcho(422, {
      message: "The given data was invalid.",
      errors: {
        email: ["must be a valid email address"],
        roles: ["must be an array"],
      },
    });
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isHttpError(cause) && cause.kind === "validation") {
      expect(cause.fieldErrors["email"]).toEqual([
        "must be a valid email address",
      ]);
      expect(cause.fieldErrors["roles"]).toEqual(["must be an array"]);
      return;
    }
    throw new Error(`expected a validation HttpError, got: ${String(cause)}`);
  });

  it("tolerates malformed 422 bodies with empty field errors", async () => {
    useFreshHandlers();
    setErrorEcho(422, { unexpected: "shape" });
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isHttpError(cause) && cause.kind === "validation") {
      expect(cause.fieldErrors).toEqual({});
      return;
    }
    throw new Error(`expected a validation HttpError, got: ${String(cause)}`);
  });

  it("handles non-array or array bodies in parseFieldErrors gracefully", () => {
    expect(parseFieldErrors(null)).toEqual({});
    expect(parseFieldErrors("a string")).toEqual({});
    expect(parseFieldErrors([])).toEqual({});
    expect(parseFieldErrors({ errors: "not an object" })).toEqual({});
    expect(parseFieldErrors({ errors: [1, 2, 3] })).toEqual({});
    expect(
      parseFieldErrors({
        errors: { name: "single error", email: ["valid error", 123] },
      }),
    ).toEqual({
      name: ["single error"],
      email: ["valid error"],
    });
  });

  it("never copies raw response text into the safe error message", async () => {
    useFreshHandlers();
    setErrorEcho(500, `stack trace touched ${PII_PROBE}`);
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isHttpError(cause)) {
      expect(cause.message).not.toContain(PII_PROBE);
      expect(cause.message).toBe(
        "The service is temporarily unavailable. Please try again later.",
      );
      return;
    }
    throw new Error(`expected an HttpError, got: ${String(cause)}`);
  });
});

describe("api base url validation and factory boundary", () => {
  it.each([
    ["missing value", undefined],
    ["empty value", ""],
    ["blank value", "   "],
    ["not a url", "localhost:8000/api"],
    ["ftp protocol", "ftp://localhost:8000"],
    ["embedded credentials", "http://user:pass@localhost:8000"],
    ["query string", "http://localhost:8000/?env=dev"],
    ["fragment", "http://localhost:8000/#/admin"],
  ])("fails closed on %s", (_label, raw) => {
    expect(() => resolveApiBaseUrl(raw)).toThrow(InvalidApiBaseUrlError);
  });

  it("normalizes a valid base url and keeps an explicit path", () => {
    expect(resolveApiBaseUrl("http://localhost:8000/")).toBe(
      "http://localhost:8000",
    );
    expect(resolveApiBaseUrl("https://api.example.com/base///")).toBe(
      "https://api.example.com/base",
    );
  });

  it("fails closed at the createHttpClient factory boundary", () => {
    expect(() => createHttpClient("http://user:pass@localhost:8000")).toThrow(
      InvalidApiBaseUrlError,
    );
    expect(() => createHttpClient("ftp://localhost:8000")).toThrow(
      InvalidApiBaseUrlError,
    );
  });

  it("resolves apiBaseUrlFromEnv correctly or fails closed", () => {
    expect(apiBaseUrlFromEnv({ VITE_API_URL: "http://localhost:8000" })).toBe(
      "http://localhost:8000",
    );
    expect(() => apiBaseUrlFromEnv(null)).toThrow(InvalidApiBaseUrlError);
    expect(() => apiBaseUrlFromEnv({})).toThrow(InvalidApiBaseUrlError);
    expect(() => apiBaseUrlFromEnv([])).toThrow(InvalidApiBaseUrlError);
  });
});

describe("type guards and structural variant validation", () => {
  it("narrows genuine HttpError instances and rejects malformed objects", () => {
    const validUnauthorized = {
      kind: "unauthorized" as const,
      status: 401,
      message: "Your session is not authenticated or has expired.",
    };
    expect(isHttpError(validUnauthorized)).toBe(true);

    // Negative tests for malformed or forged objects
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
    expect(isHttpError("error")).toBe(false);
    expect(isHttpError([])).toBe(false);
    expect(isHttpError({})).toBe(false);
    expect(isHttpError({ kind: "unknown" })).toBe(false);
    expect(
      isHttpError({ kind: "unauthorized", status: 500, message: "wrong" }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "validation",
        status: 422,
        message: "Some fields need your attention.",
        fieldErrors: "not-an-object",
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "validation",
        status: 422,
        message: "Some fields need your attention.",
        fieldErrors: { email: [123] },
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "rate_limited",
        status: 429,
        message: "Too many requests. Please wait before trying again.",
        retryAfterSeconds: -5,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "network",
        status: 200,
        message: "The service could not be reached. Check your connection.",
        timedOut: false,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "cancelled",
        status: null,
        message: "The request was cancelled.",
        timedOut: true,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "server_error",
        status: 700,
        message:
          "The service is temporarily unavailable. Please try again later.",
      }),
    ).toBe(false);
  });

  it("checks specific guards: isValidationHttpError, isRateLimitedHttpError, isCsrfMismatchHttpError", () => {
    const valid422 = {
      kind: "validation" as const,
      status: 422 as const,
      message: "Some fields need your attention.",
      fieldErrors: {},
    };
    const valid429 = {
      kind: "rate_limited" as const,
      status: 429 as const,
      message: "Too many requests. Please wait before trying again.",
      retryAfterSeconds: 30,
    };
    const valid419 = {
      kind: "csrf_mismatch" as const,
      status: 419,
      message: "Your security token expired and the action was not completed.",
    };

    expect(isValidationHttpError(valid422)).toBe(true);
    expect(isValidationHttpError(valid429)).toBe(false);

    expect(isRateLimitedHttpError(valid429)).toBe(true);
    expect(isRateLimitedHttpError(valid422)).toBe(false);

    expect(isCsrfMismatchHttpError(valid419)).toBe(true);
    expect(isCsrfMismatchHttpError(valid429)).toBe(false);
  });
});
