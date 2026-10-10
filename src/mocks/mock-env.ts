export const MOCK_API_ENV_VAR = "VITE_MOCK_API";

export interface MockApiEnv {
  readonly DEV?: unknown;
  readonly VITE_MOCK_API?: unknown;
}

export const isMockApiEnabled = (env: MockApiEnv): boolean => {
  return env.DEV === true && env.VITE_MOCK_API === "1";
};

export const isMockedApiUrl = (
  url: string | null,
  apiBaseUrl: string,
): boolean => {
  return url !== null && url.startsWith(apiBaseUrl);
};
