import axios, { AxiosHeaders, CanceledError } from "axios";
import type {
  AxiosAdapter,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { expect, it } from "vitest";
import { createHttpClient, isValidationHttpError } from "@/lib/http";
import type { HttpClient } from "@/lib/http";
import { createApiMutator } from "@/lib/http/orval-mutator";
const API_ROOT = "http://127.0.0.1:8090";
type BaseUrlLayer = "config" | "options";
type UnsafeBaseUrlCase = readonly [string, BaseUrlLayer, unknown];
const UNSAFE_BASE_URL_CASES: readonly UnsafeBaseUrlCase[] = [
  ["foreign URL", "config", "https://outside.invalid"],
  ["foreign URL", "options", "https://outside.invalid"],
  ["empty string", "config", ""],
  ["empty string", "options", ""],
  ["null", "config", null],
  ["null", "options", null],
  ["explicit undefined", "config", undefined],
  ["explicit undefined", "options", undefined],
  ["plain object", "config", {}],
  ["plain object", "options", {}],
  ["String object", "config", new String(API_ROOT)],
  ["String object", "options", new String(API_ROOT)],
  ["control character", "config", `${API_ROOT}/\n`],
  ["control character", "options", `${API_ROOT}/\n`],
  ["surrounding whitespace", "config", ` ${API_ROOT} `],
  ["surrounding whitespace", "options", ` ${API_ROOT} `],
  ["foreign URL with path", "config", "https://outside.invalid/api/v1"],
  ["foreign URL with path", "options", "https://outside.invalid/api/v1"],
  ["protocol-relative URL", "config", "//outside.invalid/api/v1"],
  ["protocol-relative URL", "options", "//outside.invalid/api/v1"],
];
const responseFor = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse<unknown> => {
  return {
    config,
    data,
    headers: new AxiosHeaders(),
    status,
    statusText: String(status),
  };
};
const fixtureFor = (
  adapter: AxiosAdapter,
): {
  client: HttpClient;
  mutator: ReturnType<typeof createApiMutator>;
} => {
  const client = createHttpClient(API_ROOT);
  client.instance.defaults.adapter = adapter;
  return { client, mutator: createApiMutator(client, API_ROOT) };
};
it("returns generic data and joins full contract path against root origin once", async () => {
  const observed: InternalAxiosRequestConfig[] = [];
  const fixture = fixtureFor(async (config) => {
    observed.push(config);
    return responseFor(config, 200, { result: "fixture" });
  });
  const result = await fixture.mutator<{
    result: string;
  }>({
    method: "GET",
    url: "/api/v1/fixture",
  });
  const configuredResult = await fixture.mutator<{
    result: string;
  }>({
    baseURL: API_ROOT,
    method: "GET",
    url: "/api/v1/config-root",
  });
  const optionResult = await fixture.mutator<{
    result: string;
  }>(
    {
      method: "GET",
      url: "/api/v1/options-root",
    },
    { baseURL: API_ROOT },
  );
  expect(result).toEqual({ result: "fixture" });
  expect(configuredResult).toEqual({ result: "fixture" });
  expect(optionResult).toEqual({ result: "fixture" });
  expect(observed).toHaveLength(3);
  expect(fixture.client.instance.getUri(observed[0])).toBe(
    `${API_ROOT}/api/v1/fixture`,
  );
  expect(fixture.client.instance.getUri(observed[1])).toBe(
    `${API_ROOT}/api/v1/config-root`,
  );
  expect(fixture.client.instance.getUri(observed[2])).toBe(
    `${API_ROOT}/api/v1/options-root`,
  );
});
it("propagates an already-aborted signal as cancellation before adapter dispatch", async () => {
  const controller = new AbortController();
  controller.abort();
  let adapterCalls = 0;
  const fixture = fixtureFor(async (config) => {
    adapterCalls += 1;
    throw new CanceledError("fixture", config);
  });
  await expect(
    fixture.mutator({
      method: "GET",
      signal: controller.signal,
      url: "/api/v1/cancelled",
    }),
  ).rejects.toMatchObject({ kind: "cancelled" });
  expect(adapterCalls).toBe(0);
});
it("rejects foreign destinations before adapter dispatch", async () => {
  let adapterCalls = 0;
  const fixture = fixtureFor(async (config) => {
    adapterCalls += 1;
    return responseFor(config, 200, null);
  });
  await expect(
    fixture.mutator({
      method: "GET",
      url: "https://outside.invalid/api/v1/fixture",
    }),
  ).rejects.toMatchObject({ kind: "unexpected" });
  expect(adapterCalls).toBe(0);
});
it.each(UNSAFE_BASE_URL_CASES)(
  "rejects %s baseURL in %s layer before dispatch",
  async (_caseName, layer, unsafeBaseURL) => {
    let adapterCalls = 0;
    const fixture = fixtureFor(async (config) => {
      adapterCalls += 1;
      return responseFor(config, 200, null);
    });
    const config: AxiosRequestConfig<unknown> = {
      method: "GET",
      url: "/api/v1/fixture",
    };
    const options: AxiosRequestConfig<unknown> = {};
    if (layer === "config") {
      Object.defineProperty(config, "baseURL", {
        enumerable: true,
        value: unsafeBaseURL,
      });
      options.baseURL = API_ROOT;
    }
    if (layer === "options") {
      config.baseURL = API_ROOT;
      Object.defineProperty(options, "baseURL", {
        enumerable: true,
        value: unsafeBaseURL,
      });
    }
    let failure: unknown = null;
    try {
      await fixture.mutator(config, options);
    } catch (cause: unknown) {
      failure = cause;
    }
    expect.soft(failure).toMatchObject({
      kind: "unexpected",
      message: "Uma resposta inesperada foi recebida.",
    });
    expect.soft(adapterCalls).toBe(0);
  },
);
it("resets CSRF singleflight on 419 without replay and keeps CSRF path at root", async () => {
  const paths: string[] = [];
  let fixture: ReturnType<typeof fixtureFor> | null = null;
  const adapter: AxiosAdapter = async (config) => {
    const activeFixture = fixture;
    if (activeFixture === null) {
      throw new Error("Fixture ainda não foi inicializada.");
    }
    const path = new URL(activeFixture.client.instance.getUri(config)).pathname;
    paths.push(path);
    if (path === "/sanctum/csrf-cookie") {
      return responseFor(config, 204, null);
    }
    throw new axios.AxiosError(
      "fixture",
      undefined,
      config,
      undefined,
      responseFor(config, 419, { message: "fixture" }),
    );
  };
  fixture = fixtureFor(adapter);
  await expect(
    fixture.mutator({ method: "POST", url: "/api/v1/fixture" }),
  ).rejects.toMatchObject({ kind: "csrf_mismatch" });
  expect(paths).toEqual(["/sanctum/csrf-cookie", "/api/v1/fixture"]);
  await expect(
    fixture.mutator({ method: "POST", url: "/api/v1/fixture" }),
  ).rejects.toMatchObject({ kind: "csrf_mismatch" });
  expect(paths).toEqual([
    "/sanctum/csrf-cookie",
    "/api/v1/fixture",
    "/sanctum/csrf-cookie",
    "/api/v1/fixture",
  ]);
});
it("normalizes validation fields with null prototype and preserves dangerous names", async () => {
  const validationBody: unknown = JSON.parse(
    '{"errors":{"__proto__":["fixture"],"constructor":["fixture"]}}',
  );
  const fixture = fixtureFor(async (config) => {
    throw new axios.AxiosError(
      "fixture",
      undefined,
      config,
      undefined,
      responseFor(config, 422, validationBody),
    );
  });
  let failure: unknown;
  try {
    await fixture.mutator({ method: "POST", url: "/api/v1/fixture" });
  } catch (cause: unknown) {
    failure = cause;
  }
  expect(isValidationHttpError(failure)).toBe(true);
  if (!isValidationHttpError(failure)) {
    throw new Error("Erro de validação não foi normalizado.");
  }
  expect(Object.getPrototypeOf(failure.fieldErrors)).toBeNull();
  expect(failure.fieldErrors["__proto__"]).toEqual(["fixture"]);
  expect(failure.fieldErrors["constructor"]).toEqual(["fixture"]);
});
