import { http, HttpResponse } from "msw";
import { NetworkReadyState } from "msw/experimental";
import { describe, expect, it, vi } from "vitest";
import { createInPageMockNetwork, startInPageMock } from "./in-page-mock";
import type { InPageMockNetwork, InPageMockOptions } from "./in-page-mock";

const pingHandler = () =>
  http.get("http://localhost:8000/api/v1/ping", () => HttpResponse.json({}));

describe("createInPageMockNetwork", () => {
  it("sets up in-page interception without enabling it", () => {
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

  it("passes handlers and frame handling to the network and enables interception", async () => {
    const { createNetwork, enable } = createNetworkMock();
    const handlers = [pingHandler()];
    const onUnhandledFrame = vi.fn();

    await startInPageMock({ handlers, onUnhandledFrame, createNetwork });

    expect(enable).toHaveBeenCalledTimes(1);
    const [inPageOptions] = createNetwork.mock.calls[0] ?? [];
    expect(inPageOptions?.handlers).toEqual(handlers);
    expect(inPageOptions?.onUnhandledFrame).toBe(onUnhandledFrame);
  });

  it("propagates failure when enabling in-page interception", async () => {
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
