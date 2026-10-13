import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";
import { defineNetwork, InterceptorSource } from "msw/experimental";
import type { NetworkReadyState } from "msw/experimental";
import type { RequestHandler } from "msw";
import type { StartOptions } from "msw/browser";

export type UnhandledFrameHandler = NonNullable<
  StartOptions["onUnhandledFrame"]
>;

export interface InPageMockOptions {
  readonly handlers: readonly RequestHandler[];
  readonly onUnhandledFrame: UnhandledFrameHandler;
}

export interface InPageMockNetwork {
  readonly readyState: NetworkReadyState;
  enable(): Promise<unknown> | void;
}

export const createInPageMockNetwork = ({
  handlers,
  onUnhandledFrame,
}: InPageMockOptions): InPageMockNetwork => {
  return defineNetwork({
    sources: [
      new InterceptorSource({
        interceptors: [new FetchInterceptor(), new XMLHttpRequestInterceptor()],
      }),
    ],
    handlers: [...handlers],
    onUnhandledFrame,
  });
};

export interface StartInPageMockOptions extends InPageMockOptions {
  readonly createNetwork?: (options: InPageMockOptions) => InPageMockNetwork;
}

export const startInPageMock = async ({
  createNetwork = createInPageMockNetwork,
  ...options
}: StartInPageMockOptions): Promise<void> => {
  await createNetwork(options).enable();
};
