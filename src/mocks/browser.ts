import { setupWorker } from "msw/browser";
import { apiBaseUrlFromEnv } from "@/lib/http/config";
import { isMockedApiUrl } from "./mock-env";
import { createMockDatabase } from "./mock-data";
import { createMockHandlers } from "./mock-handlers";
import { parseMockScenario } from "./mock-scenario";

export class MockWorkerStartError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MockWorkerStartError";
  }
}

const frameUrlOf = (frame: unknown): string | null => {
  if (typeof frame !== "object" || frame === null || !("request" in frame)) {
    return null;
  }
  const request: unknown = frame.request;
  if (typeof request !== "object" || request === null) {
    return null;
  }
  if (!("url" in request) || typeof request.url !== "string") {
    return null;
  }
  return request.url;
};

export const startMockWorker = async (): Promise<void> => {
  const apiBaseUrl = apiBaseUrlFromEnv(import.meta.env);
  const scenario = parseMockScenario(window.location.search);
  const worker = setupWorker(
    ...createMockHandlers({
      apiBaseUrl,
      database: createMockDatabase(),
      scenario,
    }),
  );
  try {
    await worker.start({
      onUnhandledFrame: ({ frame, defaults }) => {
        if (isMockedApiUrl(frameUrlOf(frame), apiBaseUrl)) {
          defaults.error();
        }
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MockWorkerStartError(
      `Modo mock indisponível: o worker MSW não inicializou (${detail}). Nenhuma requisição foi enviada à API real.`,
    );
  }
};
