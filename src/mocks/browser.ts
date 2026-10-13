import { apiBaseUrlFromEnv } from "@/lib/http/config";
import { setupWorker } from "msw/browser";
import type { StartOptions } from "msw/browser";
import type { RequestHandler } from "msw";
import { createInPageMockNetwork, startInPageMock } from "./in-page-mock";
import type {
  InPageMockNetwork,
  InPageMockOptions,
  UnhandledFrameHandler,
} from "./in-page-mock";
import { createMockDatabase } from "./mock-data";
import { isMockedApiUrl } from "./mock-env";
import { createMockHandlers } from "./mock-handlers";
import { parseMockScenario } from "./mock-scenario";
import {
  isUnusableDocumentError,
  mockErrorDetail,
  waitForActiveDocument,
} from "./mock-worker";
import type { MockDocument } from "./mock-worker";

export class MockWorkerStartError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MockWorkerStartError";
  }
}

export interface MockWorker {
  start(options: StartOptions): Promise<unknown>;
}

export interface StartMockWorkerOptions {
  readonly createWorker?: (handlers: RequestHandler[]) => MockWorker;
  readonly createInPageNetwork?: (
    options: InPageMockOptions,
  ) => InPageMockNetwork;
  readonly document?: MockDocument;
  readonly warn?: (message: string) => void;
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

const workerFailureMessage = (detail: string): string =>
  `Modo mock indisponível: o worker MSW não inicializou (${detail}). Nenhuma requisição foi enviada à API real.`;

const unusableDocumentMessage = (detail: string): string =>
  `Modo mock indisponível: este documento não pode usar Service Workers (${detail}). Abra a URL em uma aba normal do navegador, fora de previews, webviews ou iframes, e confirme que cookies e dados do site não estão bloqueados para esta origem. Nenhuma requisição foi enviada à API real.`;

export const startMockWorker = async (
  options: StartMockWorkerOptions = {},
): Promise<void> => {
  const {
    createWorker = (handlers: RequestHandler[]) => setupWorker(...handlers),
    createInPageNetwork = createInPageMockNetwork,
    document: documentLike = globalThis.document,
    warn = (message: string) => console.warn(message),
  } = options;
  const apiBaseUrl = apiBaseUrlFromEnv(import.meta.env);
  const scenario = parseMockScenario(window.location.search);
  const handlers = createMockHandlers({
    apiBaseUrl,
    database: createMockDatabase(),
    scenario,
  });
  const onUnhandledFrame: UnhandledFrameHandler = ({ frame, defaults }) => {
    if (isMockedApiUrl(frameUrlOf(frame), apiBaseUrl)) {
      defaults.error();
    }
  };

  await waitForActiveDocument(documentLike);

  try {
    await createWorker(handlers).start({ onUnhandledFrame });
    return;
  } catch (error: unknown) {
    if (!isUnusableDocumentError(error)) {
      throw new MockWorkerStartError(
        workerFailureMessage(mockErrorDetail(error)),
      );
    }
    warn(
      `[mock] este documento não pode usar Service Workers (${mockErrorDetail(error)}); as requisições da API serão interceptadas na própria página.`,
    );
    try {
      await startInPageMock({
        handlers,
        onUnhandledFrame,
        createNetwork: createInPageNetwork,
      });
    } catch (inPageError: unknown) {
      throw new MockWorkerStartError(
        unusableDocumentMessage(
          `${mockErrorDetail(error)}; interceptação em página: ${mockErrorDetail(inPageError)}`,
        ),
      );
    }
  }
};
