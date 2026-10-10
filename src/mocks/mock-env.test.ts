import { describe, expect, it } from "vitest";
import { isMockApiEnabled, isMockedApiUrl, MOCK_API_ENV_VAR } from "./mock-env";

describe("isMockApiEnabled", () => {
  it.each([
    { dev: true, flag: "1", expected: true },
    { dev: true, flag: "0", expected: false },
    { dev: true, flag: undefined, expected: false },
    { dev: false, flag: "1", expected: false },
    { dev: false, flag: "0", expected: false },
    { dev: false, flag: undefined, expected: false },
  ])(
    "requires DEV and flag (dev=$dev flag=$flag)",
    ({ dev, flag, expected }) => {
      expect(isMockApiEnabled({ DEV: dev, [MOCK_API_ENV_VAR]: flag })).toBe(
        expected,
      );
    },
  );

  it("is disabled by default in the test environment", () => {
    expect(import.meta.env[MOCK_API_ENV_VAR]).toBeUndefined();
    expect(isMockApiEnabled(import.meta.env)).toBe(false);
  });
});

describe("isMockedApiUrl", () => {
  const apiBaseUrl = "http://localhost:8000";
  it.each([
    { url: "http://localhost:8000/api/v1/users", expected: true },
    { url: "http://localhost:8000/sanctum/csrf-cookie", expected: true },
    { url: "http://localhost:5173/src/main.ts", expected: false },
    { url: "http://localhost:5173/users?mock=full", expected: false },
    { url: null, expected: false },
  ])("classifies '$url' as api=$expected", ({ url, expected }) => {
    expect(isMockedApiUrl(url, apiBaseUrl)).toBe(expected);
  });
});
