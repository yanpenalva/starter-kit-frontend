import { http, HttpResponse } from "msw";
import { NetworkReadyState } from "msw/experimental";
import { describe, expect, it, vi } from "vitest";
import { createInPageMockNetwork, startInPageMock } from "./in-page-mock";
import type { InPageMockNetwork, InPageMockOptions } from "./in-page-mock";

const pingHandler = () =>
  http.get("http://localhost:8000/api/v1/ping", () => HttpResponse.json({}));

describe("createInPageMockNetwork", () => {
  it("monta a interceptação em página sem ativá-la", () => {
    const network = createInPageMockNetwork({
      handlers: [pingHandler()],
      onUnhandledFrame: () => {},
    });

    expect(network.readyState).toBe(NetworkReadyState.DISABLED);
    expect(network.enable).toBeTypeOf("function");
  });
});

describe("startInPageMock", () => {
  const createNetworkMock = () => {
    const enable = vi.fn(async (): Promise<unknown> => undefined);
    const createNetwork = vi.fn<
      (options: InPageMockOptions) => InPageMockNetwork
    >(() => ({
      readyState: NetworkReadyState.DISABLED,
      enable,
    }));
    return { createNetwork, enable };
  };

  it("entrega handlers e tratamento de frame à rede e ativa a interceptação", async () => {
    const { createNetwork, enable } = createNetworkMock();
    const handlers = [pingHandler()];
    const onUnhandledFrame = vi.fn();

    await startInPageMock({ handlers, onUnhandledFrame, createNetwork });

    expect(enable).toHaveBeenCalledTimes(1);
    const [inPageOptions] = createNetwork.mock.calls[0] ?? [];
    expect(inPageOptions?.handlers).toEqual(handlers);
    expect(inPageOptions?.onUnhandledFrame).toBe(onUnhandledFrame);
  });

  it("propaga falha ao ativar a interceptação em página", async () => {
    const createNetwork = vi.fn<
      (options: InPageMockOptions) => InPageMockNetwork
    >(() => ({
      readyState: NetworkReadyState.DISABLED,
      enable: () => Promise.reject(new Error("interceptadores indisponíveis")),
    }));

    await expect(
      startInPageMock({
        handlers: [pingHandler()],
        onUnhandledFrame: () => {},
        createNetwork,
      }),
    ).rejects.toThrow("interceptadores indisponíveis");
  });
});
