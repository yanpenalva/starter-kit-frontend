import { describe, expect, it } from "vitest";
import { DEFAULT_MOCK_SCENARIO, parseMockScenario } from "./mock-scenario";

describe("parseMockScenario", () => {
  it.each([
    { search: "?mock=full", expected: "full" },
    { search: "?mock=empty", expected: "empty" },
    { search: "?mock=slow", expected: "slow" },
    { search: "?mock=error", expected: "error" },
    { search: "mock=slow", expected: "slow" },
    { search: "?page=2&mock=error", expected: "error" },
    { search: "?mock=bogus", expected: DEFAULT_MOCK_SCENARIO },
    { search: "?other=1", expected: DEFAULT_MOCK_SCENARIO },
    { search: "", expected: DEFAULT_MOCK_SCENARIO },
    { search: null, expected: DEFAULT_MOCK_SCENARIO },
    { search: undefined, expected: DEFAULT_MOCK_SCENARIO },
  ])("parses '$search' as '$expected'", ({ search, expected }) => {
    expect(parseMockScenario(search)).toBe(expected);
  });
});
