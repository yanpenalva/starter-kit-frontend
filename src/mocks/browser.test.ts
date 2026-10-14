import type { StartOptions } from "msw/browser";
import { NetworkReadyState } from "msw/experimental";
import { describe, expect, it, vi } from "vitest";
import { MockWorkerStartError, startMockWorker } from "./browser";
import type { MockWorker, StartMockWorkerOptions } from "./browser";
import type { InPageMockNetwork, InPageMockOptions } from "./in-page-mock";
import type { MockDocument } from "./mock-worker";

const API_BASE_URL = "http://localhost:8000";

const createDocumentLike = (prerendering = false): MockDocument =>
  Object.assign(new EventTarget(), { prerendering });

const serviceWorkerUnavailableError = (): Error =>
  Object.assign(
    new Error(
      "Failed to get ServiceWorkerRegistration objects: The document is in an invalid state.",
    ),
    { name: "InvalidStateError" },
  );

const createWorkerStart = () =>
  vi.fn<(options: StartOptions) => Promise<unknown>>(async () => undefined);

type WorkerStart = ReturnType<typeof createWorkerStart>;

const startOptionsOf = (start: WorkerStart): StartOptions => {
  const [options] = start.mock.calls[0] ?? [];
  if (options === undefined) {
    throw new Error("o worker mock não foi iniciado");
  }
  return options;
};

const unhandledFrameOf = (
  start: WorkerStart,
): NonNullable<StartOptions["onUnhandledFrame"]> => {
  const { onUnhandledFrame } = startOptionsOf(start);
  if (onUnhandledFrame === undefined) {
    throw new Error("o worker mock não recebeu onUnhandledFrame");
  }
  return onUnhandledFrame;
};

const invokeUnhandledFrame = (
  onUnhandledFrame: NonNullable<StartOptions["onUnhandledFrame"]>,
  url: string,
): ReturnType<typeof vi.fn> => {
  const error = vi.fn();
  const defaults = { error, warn: vi.fn() };
  const call = onUnhandledFrame as unknown as (args: {
    frame: unknown;
    defaults: typeof defaults;
  }) => void;

  call({ frame: { request: { url } }, defaults });

  return error;
};

const createInPageNetworkMock = () => {
  const enable = vi.fn(async (): Promise<unknown> => undefined);
  const createInPageNetwork = vi.fn<
    (options: InPageMockOptions) => InPageMockNetwork
  >(() => ({
    readyState: NetworkReadyState.DISABLED,
    enable,
  }));
  return { createInPageNetwork, enable };
};

const createOptions = (
  start: WorkerStart,
  overrides: Partial<StartMockWorkerOptions> = {},
): StartMockWorkerOptions => ({
  createWorker: (): MockWorker => ({ start }),
  document: createDocumentLike(),
  warn: vi.fn(),
  ...overrides,
});

describe("startMockWorker", () => {
  it("starts the MSW worker without in-page interception", async () => {
    const start = createWorkerStart();
    const { createInPageNetwork, enable } = createInPageNetworkMock();
    const warn = vi.fn();

    await startMockWorker(createOptions(start, { createInPageNetwork, warn }));

    expect(start).toHaveBeenCalledTimes(1);
    expect(unhandledFrameOf(start)).toBeTypeOf("function");
    expect(createInPageNetwork).not.toHaveBeenCalled();
    expect(enable).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("waits for prerender activation before starting", async () => {
    const start = createWorkerStart();
    const documentLike = createDocumentLike(true);

    const pending = startMockWorker(
      createOptions(start, { document: documentLike }),
    );
    expect(start).not.toHaveBeenCalled();

    documentLike.dispatchEvent(new Event("prerenderingchange"));
    await pending;

    expect(start).toHaveBeenCalledTimes(1);
  });

  it("intercepts in-page when the document cannot use Service Workers", async () => {
    const start = createWorkerStart();
    start.mockRejectedValue(serviceWorkerUnavailableError());
    const { createInPageNetwork, enable } = createInPageNetworkMock();
    const warn = vi.fn();

    await startMockWorker(createOptions(start, { createInPageNetwork, warn }));

    expect(start).toHaveBeenCalledTimes(1);
    expect(enable).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("na própria página"),
    );

    const [inPageOptions] = createInPageNetwork.mock.calls[0] ?? [];
    expect(inPageOptions?.handlers.length).toBeGreaterThan(0);
    expect(inPageOptions?.onUnhandledFrame).toBe(unhandledFrameOf(start));
  });

  it("explains in pt-BR when in-page interception also fails", async () => {
    const start = createWorkerStart();
    start.mockRejectedValue(serviceWorkerUnavailableError());
    const { createInPageNetwork, enable } = createInPageNetworkMock();
    enable.mockRejectedValueOnce(new Error("interceptadores indisponíveis"));

    const failure = await startMockWorker(
      createOptions(start, { createInPageNetwork }),
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(MockWorkerStartError);
    expect((failure as Error).message).toContain("aba normal do navegador");
    expect((failure as Error).message).toContain(
      "interceptadores indisponíveis",
    );
    expect((failure as Error).message).toContain(
      "Nenhuma requisição foi enviada à API real.",
    );
  });

  it("does not intercept in-page when the failure is not from the document", async () => {
    const start = createWorkerStart();
    start.mockRejectedValue(
      new Error(
        "Failed to register the Service Worker:\n\nService Worker script does not exist at the given path.",
      ),
    );
    const { createInPageNetwork, enable } = createInPageNetworkMock();

    const failure = await startMockWorker(
      createOptions(start, { createInPageNetwork }),
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(MockWorkerStartError);
    expect((failure as Error).message).toContain(
      "Service Worker script does not exist at the given path.",
    );
    expect((failure as Error).message).toContain(
      "Nenhuma requisição foi enviada à API real.",
    );
    expect(start).toHaveBeenCalledTimes(1);
    expect(createInPageNetwork).not.toHaveBeenCalled();
    expect(enable).not.toHaveBeenCalled();
  });

  it("fails loudly for API calls without a handler", async () => {
    const start = createWorkerStart();

    await startMockWorker(createOptions(start));

    const onUnhandledFrame = unhandledFrameOf(start);
    const apiError = invokeUnhandledFrame(
      onUnhandledFrame,
      `${API_BASE_URL}/api/v1/desconhecido`,
    );
    const appError = invokeUnhandledFrame(
      onUnhandledFrame,
      "http://localhost:5173/src/main.ts",
    );

    expect(apiError).toHaveBeenCalledTimes(1);
    expect(appError).not.toHaveBeenCalled();
  });
});
