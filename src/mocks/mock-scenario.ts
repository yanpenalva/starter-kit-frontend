export const MOCK_SCENARIO_PARAM = "mock";

export const MOCK_SCENARIOS = ["full", "empty", "slow", "error"] as const;

export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export const DEFAULT_MOCK_SCENARIO: MockScenario = "full";

const isMockScenario = (value: string): value is MockScenario => {
  return (MOCK_SCENARIOS as readonly string[]).includes(value);
};

export const parseMockScenario = (
  search: string | null | undefined,
): MockScenario => {
  const candidate =
    new URLSearchParams(search ?? "").get(MOCK_SCENARIO_PARAM) ?? "";
  return isMockScenario(candidate) ? candidate : DEFAULT_MOCK_SCENARIO;
};
