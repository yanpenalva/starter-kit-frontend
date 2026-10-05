import axios, { AxiosHeaders, CanceledError } from "axios";
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { expect, it } from "vitest";
import { createHttpClient, isValidationHttpError } from "@/lib/http";
import type { HttpClient } from "@/lib/http";
import { createApiMutator } from "@/lib/http/orval-mutator";

const API_ROOT = "http://127.0.0.1:8090";

function responseFor(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse<unknown> {
  return {
    config,
    data,
    headers: new AxiosHeaders(),
    status,
    statusText: String(status),
  };
}

function fixtureFor(adapter: AxiosAdapter): {
  client: HttpClient;
  mutator: ReturnType<typeof createApiMutator>;
} {
  const client = createHttpClient(API_ROOT);
  client.instance.defaults.adapter = adapter;
  return { client, mutator: createApiMutator(client, API_ROOT) };
}

it("returns generic data and joins full contract path against root origin once", async () => {
  let observed: InternalAxiosRequestConfig | null = null;
  const fixture = fixtureFor(async (config) => {
    observed = config;
    return responseFor(config, 200, { result: "fixture" });
  });

  const result = await fixture.mutator<{ result: string }>({
    method: "GET",
    url: "/api/v1/fixture",
  });

  expect(result).toEqual({ result: "fixture" });
  expect(observed).not.toBeNull();
  if (observed === null) {
    throw new Error("O adapter de fixture não recebeu requisição.");
  }
  expect(fixture.client.instance.getUri(observed)).toBe(
    `${API_ROOT}/api/v1/fixture`,
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
