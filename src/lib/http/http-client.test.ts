import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  buildHttpError,
  createHttpClient,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  HTTP_TIMEOUT_MS,
  InvalidApiBaseUrlError,
  InvalidEnvironmentConfigError,
  isCsrfMismatchHttpError,
  isHttpError,
  isProductionApiUrl,
  isRateLimitedHttpError,
  isValidationHttpError,
  onSessionExpired,
  parseFieldErrors,
  parseRetryAfterSeconds,
  resolveApiBaseUrl,
  resolveAppEnvironment,
  resolveEnvironmentConfig,
} from "@/lib/http";
import type { HttpClient } from "@/lib/http";
const ECHO_URL = `${TEST_API_BASE}${TEST_ECHO_PATH}`;
const CSRF_COOKIE_URL = `${TEST_API_BASE}/sanctum/csrf-cookie`;
const CSRF_CALLS = (
  calls: readonly {
    path: string;
  }[],
) => calls.filter((call) => call.path === "/sanctum/csrf-cookie");
const ECHO_CALLS = (
  calls: readonly {
    path: string;
  }[],
) => calls.filter((call) => call.path === TEST_ECHO_PATH);
const PII_PROBE = "internal-user.maria@example.com";
const useFreshHandlers = (): ReturnType<typeof createHttpTestHandlers> => {
  const recorded = createHttpTestHandlers();
  server.use(...recorded.handlers);
  return recorded;
};
const setErrorEcho = (
  status: number,
  body?: unknown,
  headers?: Record<string, string>,
): void => {
  server.use(
    http.post(ECHO_URL, ({ request }) =>
      HttpResponse.json(body ?? null, {
        status,
        headers: makeCorsHeaders(request, headers),
      }),
    ),
  );
};
const rejectedPost = async (
  client: HttpClient,
  url: string = ECHO_URL,
  options: {
    timeout?: number;
    signal?: AbortSignal;
  } = {},
): Promise<unknown> => {
  try {
    await client.instance.post(url, {}, options);
  } catch (cause: unknown) {
    return cause;
  }
  throw new Error("request unexpectedly succeeded");
};
const describeCause = (cause: unknown): string => {
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
};
const expectKind = (
  cause: unknown,
  kind: string,
  status: number | null,
): void => {
  if (!isHttpError(cause)) {
    throw new Error(`expected an HttpError, got: ${describeCause(cause)}`);
  }
  expect(cause.kind).toBe(kind);
  expect(cause.status).toBe(status);
};
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
describe("origin invariant and zero outbound dispatch on foreign targets", () => {
  let dispatchedUrls: string[] = [];
  const onRequestStart = ({ request }: { request: Request }) => {
    dispatchedUrls.push(request.url);
  };
  beforeEach(() => {
    dispatchedUrls = [];
    server.events.on("request:start", onRequestStart);
  });
  afterEach(() => {
    server.events.removeListener("request:start", onRequestStart);
    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; path=/`;
  });
  it("rejects foreign absolute URL on GET and records zero outbound requests", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    let cause: unknown;
    try {
      await client.instance.get("https://evil.example.com/api/steal");
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
  });
  it("rejects foreign absolute URL on POST before CSRF bootstrap and records zero outbound requests", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    document.cookie = `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`;
    let cause: unknown;
    try {
      await client.instance.post("https://evil.example.com/api/exfiltrate", {
        data: "sensitive",
      });
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
    expect(JSON.stringify(cause)).not.toContain(TEST_CSRF_TOKEN);
    expect(JSON.stringify(cause)).not.toContain("evil.example.com");
  });
  it("rejects protocol-relative escapes and records zero outbound requests", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    const escapes = [
      "//evil.example.com/escape",
      "\\\\evil.example.com\\escape",
      "/\\evil.example.com/escape",
      "\\/evil.example.com/escape",
      "/api\\backslash-escape",
    ];
    for (const escapeUrl of escapes) {
      dispatchedUrls = [];
      let cause: unknown;
      try {
        await client.instance.get(escapeUrl);
      } catch (err) {
        cause = err;
      }
      expectKind(cause, "unexpected", null);
      expect(dispatchedUrls).toHaveLength(0);
      expect(test.calls).toHaveLength(0);
    }
  });
  it("rejects per-request baseURL override to foreign origin and records zero outbound requests", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    let cause: unknown;
    try {
      await client.instance.get("/api/v1/test", {
        baseURL: "https://foreign-override.example.com",
      });
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
  });
  it("rejects foreign target even when allowAbsoluteUrls: true is explicitly passed", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    let cause: unknown;
    try {
      await client.instance.get("https://evil.example.com/bypass", {
        allowAbsoluteUrls: true,
      });
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
  });
  it("rejects requests if instance.defaults.baseURL is mutated to foreign origin", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    client.instance.defaults.baseURL = "https://hijacked.example.com";
    let cause: unknown;
    try {
      await client.instance.get("/api/v1/test");
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
  });
  it("permits same-origin absolute URLs matching trustedOrigin", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    const res = await client.instance.get(`${TEST_API_BASE}${TEST_ECHO_PATH}`);
    expect(res.status).toBe(200);
    expect(test.calls).toHaveLength(1);
    expect(test.calls[0]?.path).toBe(TEST_ECHO_PATH);
  });
  it.each([
    ["empty string", ""],
    ["whitespace only", "   "],
  ])(
    "rejects per-request baseURL override with %s before bootstrap and records zero outbound requests",
    async (_label, override) => {
      const test = useFreshHandlers();
      const client = createHttpClient(TEST_API_BASE);
      document.cookie = `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`;
      let cause: unknown;
      try {
        await client.instance.post(
          "/api/v1/test",
          { data: "sensitive" },
          { baseURL: override },
        );
      } catch (err) {
        cause = err;
      }
      expectKind(cause, "unexpected", null);
      expect(dispatchedUrls).toHaveLength(0);
      expect(test.calls).toHaveLength(0);
    },
  );
  it.each([
    ["empty string", ""],
    ["whitespace only", "   "],
    ["undefined", undefined],
    ["null", null],
  ])(
    "rejects requests if instance.defaults.baseURL is mutated to %s and records zero outbound requests",
    async (_label, mutated) => {
      const test = useFreshHandlers();
      const client = createHttpClient(TEST_API_BASE);
      client.instance.defaults.baseURL = mutated as unknown as string;
      let cause: unknown;
      try {
        await client.instance.get("/api/v1/test");
      } catch (err) {
        cause = err;
      }
      expectKind(cause, "unexpected", null);
      expect(dispatchedUrls).toHaveLength(0);
      expect(test.calls).toHaveLength(0);
    },
  );
  it("rejects String-object foreign baseURL override and records zero outbound requests", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    document.cookie = `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`;
    let cause: unknown;
    try {
      await client.instance.post(
        "/api/v1/test",
        { data: "sensitive" },
        {
          baseURL: Object(
            "https://foreign-boxed.example.com",
          ) as unknown as string,
        },
      );
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
  });
  it.each([
    ["number", 42],
    ["array", ["https://foreign-array.example.com"]],
    ["plain object", { href: "https://foreign-object.example.com" }],
  ])(
    "rejects unexpected non-string baseURL override of type %s and records zero outbound requests",
    async (_label, override) => {
      const test = useFreshHandlers();
      const client = createHttpClient(TEST_API_BASE);
      let cause: unknown;
      try {
        await client.instance.get("/api/v1/test", {
          baseURL: override as unknown as string,
        });
      } catch (err) {
        cause = err;
      }
      expectKind(cause, "unexpected", null);
      expect(dispatchedUrls).toHaveLength(0);
      expect(test.calls).toHaveLength(0);
    },
  );
  it("rejects String-object foreign URL and records zero outbound requests", async () => {
    const test = useFreshHandlers();
    const client = createHttpClient(TEST_API_BASE);
    let cause: unknown;
    try {
      await client.instance.get(
        Object("https://evil-boxed.example.com/steal") as unknown as string,
      );
    } catch (err) {
      cause = err;
    }
    expectKind(cause, "unexpected", null);
    expect(dispatchedUrls).toHaveLength(0);
    expect(test.calls).toHaveLength(0);
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
    const firstMutation = client.instance.post(TEST_ECHO_PATH, {});
    await firstCallReceived;
    client.resetCsrfBootstrap();
    const secondMutation = client.instance.post(TEST_ECHO_PATH, {});
    failFirstCsrf();
    await expect(firstMutation).rejects.toThrow();
    await expect(secondMutation).resolves.toBeDefined();
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
    echoStatus = 200;
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
    expect(
      buildHttpError({ kind: "unexpected", status: 50 }).status,
    ).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: 99 }).status,
    ).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: 600 }).status,
    ).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: 650 }).status,
    ).toBeNull();
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
  it("parses valid leap day in deterministic clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-02-29T11:58:00Z"));
    try {
      const parsed = parseRetryAfterSeconds("Tue, 29 Feb 2028 12:00:00 GMT");
      expect(parsed).toBe(120);
    } finally {
      vi.useRealTimers();
    }
  });
  it("rejects impossible calendar dates and time overflows in Retry-After headers", () => {
    expect(parseRetryAfterSeconds("Sun, 31 Feb 2026 12:00:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Sun, 29 Feb 2026 12:00:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Thu, 31 Apr 2026 12:00:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Wed, 31 Jun 2026 12:00:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Sun, 04 Oct 2026 24:00:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Sun, 04 Oct 2026 25:00:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Sun, 04 Oct 2026 12:60:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Sun, 04 Oct 2026 12:00:60 GMT")).toBeNull();
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
  it("keeps JSON __proto__ and constructor keys as plain field errors without polluting prototypes", () => {
    const body = JSON.parse(
      '{"errors":{"__proto__":["must stay a field"],"constructor":["must stay a field"],"email":["must be a valid email address"]}}',
    ) as unknown;
    const fields = parseFieldErrors(body);
    expect(Object.keys(fields).sort()).toEqual([
      "__proto__",
      "constructor",
      "email",
    ]);
    expect(fields["email"]).toEqual(["must be a valid email address"]);
    expect(Object.getOwnPropertyDescriptor(fields, "__proto__")?.value).toEqual(
      ["must stay a field"],
    );
    expect("polluted" in {}).toBe(false);
    expect(
      ({} as Record<string, unknown>)["must stay a field"],
    ).toBeUndefined();
  });
  it("maps 422 bodies carrying JSON __proto__ keys to validation errors with guards passing", async () => {
    useFreshHandlers();
    setErrorEcho(
      422,
      JSON.parse(
        '{"message":"The given data was invalid.","errors":{"__proto__":["must stay a field"],"email":["must be a valid email address"]}}',
      ) as unknown,
    );
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isValidationHttpError(cause) && cause.kind === "validation") {
      expect(cause.fieldErrors["email"]).toEqual([
        "must be a valid email address",
      ]);
      expect(Object.keys(cause.fieldErrors)).toContain("__proto__");
      return;
    }
    throw new Error(`expected a validation HttpError, got: ${String(cause)}`);
  });
  it("never copies raw response text into the safe error message", async () => {
    useFreshHandlers();
    setErrorEcho(500, `stack trace touched ${PII_PROBE}`);
    const client = createHttpClient(TEST_API_BASE);
    const cause = await rejectedPost(client);
    if (isHttpError(cause)) {
      expect(cause.message).not.toContain(PII_PROBE);
      expect(cause.message).toBe(
        "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
      );
      return;
    }
    throw new Error(`expected an HttpError, got: ${String(cause)}`);
  });
});
describe("api base url validation and factory boundary", () => {
  it.each([
    ["missing value undefined", undefined],
    ["empty string", ""],
    ["blank whitespace only", "   "],
    ["not a url plain text", "not a url"],
    ["missing host http://", "http://"],
    ["missing host https://", "https://"],
    ["missing scheme", "localhost:8000/api"],
    ["disallowed ftp protocol", "ftp://localhost:8000"],
    ["embedded credentials", "http://user:pass@localhost:8000"],
    ["query string", "http://localhost:8000/?env=dev"],
    ["fragment", "http://localhost:8000/#/admin"],
    ["backslash in authority", "http://localhost\\8000"],
    ["backslash in path", "http://localhost:8000\\api"],
    ["backslash scheme separator", "http:\\\\localhost:8000"],
    ["no slash http:authority", "http:example.com"],
    ["no slash https:authority", "https:example.com"],
    ["single slash http:/authority", "http:/example.com"],
    ["single slash https:/authority", "https:/example.com"],
    ["triple slash http:///authority", "http:///example.com"],
    ["triple slash https:///authority", "https:///example.com"],
  ])("fails closed on %s", (_label, raw) => {
    expect(() => resolveApiBaseUrl(raw)).toThrow(InvalidApiBaseUrlError);
  });
  it.each([
    ["tab leading", "\thttp://localhost:8000"],
    ["tab trailing", "http://localhost:8000\t"],
    ["tab in scheme", "ht\ttp://localhost:8000"],
    ["tab in host", "http://local\thost:8000"],
    ["tab in path", "http://localhost:8000/a\tpi"],
    ["carriage return leading", "\rhttp://localhost:8000"],
    ["carriage return trailing", "http://localhost:8000\r"],
    ["carriage return in scheme", "ht\rtp://localhost:8000"],
    ["carriage return in host", "http://local\rhost:8000"],
    ["carriage return in path", "http://localhost:8000/a\rpi"],
    ["line feed leading", "\nhttp://localhost:8000"],
    ["line feed trailing", "http://localhost:8000\n"],
    ["line feed in scheme", "ht\ntp://localhost:8000"],
    ["line feed in host", "http://local\nhost:8000"],
    ["line feed in path", "http://localhost:8000/a\npi"],
  ])("rejects control characters before trim on %s", (_label, raw) => {
    expect(() => resolveApiBaseUrl(raw)).toThrow(InvalidApiBaseUrlError);
  });
  it("normalizes a valid base url and keeps an explicit path", () => {
    expect(resolveApiBaseUrl("http://localhost:8000/")).toBe(
      "http://localhost:8000",
    );
    expect(resolveApiBaseUrl("https://api.example.com/base///")).toBe(
      "https://api.example.com/base",
    );
    expect(resolveApiBaseUrl("   http://localhost:8000   ")).toBe(
      "http://localhost:8000",
    );
  });
  it("fails closed at the createHttpClient factory boundary using same rules", () => {
    expect(() => createHttpClient("http://user:pass@localhost:8000")).toThrow(
      InvalidApiBaseUrlError,
    );
    expect(() => createHttpClient("ftp://localhost:8000")).toThrow(
      InvalidApiBaseUrlError,
    );
    expect(() => createHttpClient("http:example.com")).toThrow(
      InvalidApiBaseUrlError,
    );
    expect(() => createHttpClient("http://localhost:8000\t")).toThrow(
      InvalidApiBaseUrlError,
    );
  });
  it("never exposes raw input in InvalidApiBaseUrlError message", () => {
    const sensitive = "http://secret-token:leak@localhost:8000";
    try {
      resolveApiBaseUrl(sensitive);
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidApiBaseUrlError);
      expect((err as Error).message).not.toContain("secret-token");
      expect((err as Error).message).not.toContain("leak");
    }
  });
  it("resolves apiBaseUrlFromEnv correctly or fails closed", () => {
    expect(apiBaseUrlFromEnv({ VITE_API_URL: "http://localhost:8000" })).toBe(
      "http://localhost:8000",
    );
    expect(
      apiBaseUrlFromEnv({ VITE_API_URL: "https://api.example.com/api" }),
    ).toBe("https://api.example.com/api");
    expect(() => apiBaseUrlFromEnv(null)).toThrow(InvalidApiBaseUrlError);
    expect(() => apiBaseUrlFromEnv({})).toThrow(InvalidApiBaseUrlError);
    expect(() => apiBaseUrlFromEnv([])).toThrow(InvalidApiBaseUrlError);
    expect(() =>
      apiBaseUrlFromEnv({ VITE_API_URL: "http:example.com" }),
    ).toThrow(InvalidApiBaseUrlError);
    expect(() =>
      apiBaseUrlFromEnv({ VITE_API_URL: "http://localhost:8000\n" }),
    ).toThrow(InvalidApiBaseUrlError);
  });
  it("resolves app environment with fallback to development or fails on invalid", () => {
    expect(resolveAppEnvironment({})).toBe("development");
    expect(resolveAppEnvironment(null)).toBe("development");
    expect(resolveAppEnvironment({ VITE_APP_ENV: "" })).toBe("development");
    expect(resolveAppEnvironment({ VITE_APP_ENV: "development" })).toBe(
      "development",
    );
    expect(resolveAppEnvironment({ VITE_APP_ENV: "preview" })).toBe("preview");
    expect(resolveAppEnvironment({ VITE_APP_ENV: "staging" })).toBe("staging");
    expect(resolveAppEnvironment({ VITE_APP_ENV: "production" })).toBe(
      "production",
    );
    expect(() =>
      resolveAppEnvironment({ VITE_APP_ENV: "invalid-env" }),
    ).toThrow(InvalidEnvironmentConfigError);
  });
  it("identifies production API hosts correctly", () => {
    expect(isProductionApiUrl("https://api.starterkit.com")).toBe(true);
    expect(isProductionApiUrl("https://prod-api.internal.net")).toBe(true);
    expect(isProductionApiUrl("https://production.example.com")).toBe(true);
    expect(isProductionApiUrl("http://localhost:8000")).toBe(false);
    expect(isProductionApiUrl("https://staging-api.starterkit.com")).toBe(
      false,
    );
    expect(isProductionApiUrl("invalid url")).toBe(false);
  });
  it("enforces that preview builds NEVER point to a production API", () => {
    const validPreview = resolveEnvironmentConfig({
      VITE_APP_ENV: "preview",
      VITE_API_URL: "https://staging-api.starterkit.com",
    });
    expect(validPreview.environment).toBe("preview");
    expect(validPreview.apiBaseUrl).toBe("https://staging-api.starterkit.com");
    expect(() =>
      resolveEnvironmentConfig({
        VITE_APP_ENV: "preview",
        VITE_API_URL: "https://api.starterkit.com",
      }),
    ).toThrow(InvalidEnvironmentConfigError);
    expect(() =>
      resolveEnvironmentConfig({
        VITE_APP_ENV: "preview",
        VITE_API_URL: "https://prod-api.internal.com",
      }),
    ).toThrow(InvalidEnvironmentConfigError);
    const validProd = resolveEnvironmentConfig({
      VITE_APP_ENV: "production",
      VITE_API_URL: "https://api.starterkit.com",
    });
    expect(validProd.environment).toBe("production");
    expect(validProd.apiBaseUrl).toBe("https://api.starterkit.com");
    expect(() =>
      resolveEnvironmentConfig({
        VITE_APP_ENV: "production",
        VITE_API_URL: "http://api.starterkit.com",
      }),
    ).toThrow(InvalidEnvironmentConfigError);
    expect(
      resolveEnvironmentConfig({
        VITE_APP_ENV: "staging",
        VITE_API_URL: "http://localhost:8000",
      }).apiBaseUrl,
    ).toBe("http://localhost:8000");
  });
});
describe("type guards and structural variant validation", () => {
  it("narrows genuine HttpError instances and rejects malformed objects", () => {
    const validUnauthorized = {
      kind: "unauthorized" as const,
      status: 401,
      message:
        "Sua sessão expirou ou não está autenticada. Entre novamente para continuar.",
    };
    expect(isHttpError(validUnauthorized)).toBe(true);
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
        message:
          "Alguns campos precisam de correção. Revise os itens indicados e envie novamente.",
        fieldErrors: "not-an-object",
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "validation",
        status: 422,
        message:
          "Alguns campos precisam de correção. Revise os itens indicados e envie novamente.",
        fieldErrors: { email: [123] },
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "rate_limited",
        status: 429,
        message:
          "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.",
        retryAfterSeconds: -5,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "network",
        status: 200,
        message: "Não foi possível conectar ao serviço. Verifique sua conexão.",
        timedOut: false,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "cancelled",
        status: null,
        message: "A requisição foi cancelada.",
        timedOut: true,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "server_error",
        status: 700,
        message:
          "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
      }),
    ).toBe(false);
  });
  it("checks specific guards: isValidationHttpError, isRateLimitedHttpError, isCsrfMismatchHttpError", () => {
    const valid422 = {
      kind: "validation" as const,
      status: 422 as const,
      message:
        "Alguns campos precisam de correção. Revise os itens indicados e envie novamente.",
      fieldErrors: {},
    };
    const valid429 = {
      kind: "rate_limited" as const,
      status: 429 as const,
      message:
        "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.",
      retryAfterSeconds: 30,
    };
    const valid419 = {
      kind: "csrf_mismatch" as const,
      status: 419,
      message:
        "Sua sessão de segurança expirou e a ação não foi concluída. Recarregue a página e repita a operação.",
    };
    expect(isValidationHttpError(valid422)).toBe(true);
    expect(isValidationHttpError(valid429)).toBe(false);
    expect(isRateLimitedHttpError(valid429)).toBe(true);
    expect(isRateLimitedHttpError(valid422)).toBe(false);
    expect(isCsrfMismatchHttpError(valid419)).toBe(true);
    expect(isCsrfMismatchHttpError(valid429)).toBe(false);
  });
  it("buildHttpError fails closed on malformed, primitive, and prototype-polluting inputs", () => {
    expect(isHttpError(buildHttpError(null))).toBe(true);
    expect(buildHttpError(null).kind).toBe("unexpected");
    expect(buildHttpError(undefined).kind).toBe("unexpected");
    expect(buildHttpError("string-input").kind).toBe("unexpected");
    expect(buildHttpError(12345).kind).toBe("unexpected");
    expect(buildHttpError(true).kind).toBe("unexpected");
    expect(buildHttpError([]).kind).toBe("unexpected");
    expect(buildHttpError({ kind: "__proto__" }).kind).toBe("unexpected");
    expect(buildHttpError({ kind: "toString" }).kind).toBe("unexpected");
    expect(buildHttpError({ kind: "constructor" }).kind).toBe("unexpected");
    expect(buildHttpError({ kind: "valueOf" }).kind).toBe("unexpected");
    expect(buildHttpError({ kind: "unknown_random_kind" }).kind).toBe(
      "unexpected",
    );
    const malformedValidation = buildHttpError({
      kind: "validation",
      body: "not an object",
    });
    expect(malformedValidation.kind).toBe("validation");
    if (isValidationHttpError(malformedValidation)) {
      expect(malformedValidation.fieldErrors).toEqual({});
    }
    const malformedRateLimit = buildHttpError({
      kind: "rate_limited",
      retryAfterHeader: { invalid: true },
    });
    expect(malformedRateLimit.kind).toBe("rate_limited");
    if (isRateLimitedHttpError(malformedRateLimit)) {
      expect(malformedRateLimit.retryAfterSeconds).toBeNull();
    }
  });
  it("handles out-of-bounds status codes (< 100 or > 599) in buildHttpError and isHttpError", () => {
    expect(
      buildHttpError({ kind: "unexpected", status: 50 }).status,
    ).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: 99 }).status,
    ).toBeNull();
    expect(buildHttpError({ kind: "unexpected", status: 0 }).status).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: -1 }).status,
    ).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: 600 }).status,
    ).toBeNull();
    expect(
      buildHttpError({ kind: "unexpected", status: 650 }).status,
    ).toBeNull();
    expect(
      isHttpError({
        kind: "unexpected",
        status: 50,
        message:
          "Recebemos uma resposta inesperada do serviço. Atualize a página e tente novamente.",
        timedOut: false,
      }),
    ).toBe(false);
    expect(
      isHttpError({
        kind: "unexpected",
        status: 600,
        message:
          "Recebemos uma resposta inesperada do serviço. Atualize a página e tente novamente.",
        timedOut: false,
      }),
    ).toBe(false);
  });
});
describe("session expiration notifications on 401 and 419", () => {
  it("notifies listeners on 401 unauthorized", async () => {
    useFreshHandlers();
    setErrorEcho(401);
    const client = createHttpClient(TEST_API_BASE);
    const expiredSpy = vi.fn();
    const unsubscribe = onSessionExpired(expiredSpy);
    try {
      await rejectedPost(client);
      expect(expiredSpy).toHaveBeenCalledTimes(1);
      const call = expiredSpy.mock.calls[0];
      expect(call).toBeDefined();
      expect(call![0]?.kind).toBe("unauthorized");
      expect(call![0]?.status).toBe(401);
    } finally {
      unsubscribe();
    }
  });
  it("notifies listeners on 419 csrf_mismatch", async () => {
    useFreshHandlers();
    setErrorEcho(419);
    const client = createHttpClient(TEST_API_BASE);
    const expiredSpy = vi.fn();
    const unsubscribe = onSessionExpired(expiredSpy);
    try {
      await rejectedPost(client);
      expect(expiredSpy).toHaveBeenCalledTimes(1);
      const call = expiredSpy.mock.calls[0];
      expect(call).toBeDefined();
      expect(call![0]?.kind).toBe("csrf_mismatch");
      expect(call![0]?.status).toBe(419);
    } finally {
      unsubscribe();
    }
  });
  it("does not notify listeners on other statuses like 403 or 500", async () => {
    useFreshHandlers();
    setErrorEcho(403);
    const client = createHttpClient(TEST_API_BASE);
    const expiredSpy = vi.fn();
    const unsubscribe = onSessionExpired(expiredSpy);
    try {
      await rejectedPost(client);
      expect(expiredSpy).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });
});
