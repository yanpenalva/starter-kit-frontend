import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiBaseUrlFromEnv, createHttpClient } from "@/lib/http";
import type { HttpClient, HttpError } from "@/lib/http";

export type ErrorType<T = unknown> = HttpError & {
  readonly contractError?: T;
};

type MutatorConfig = AxiosRequestConfig<unknown>;
type Mutator = <T>(
  config: MutatorConfig,
  options?: MutatorConfig,
) => Promise<T>;

export function createApiMutator(
  client: HttpClient,
  trustedRoot: string,
): Mutator {
  return async function transportApi<T>(
    config: MutatorConfig,
    options?: MutatorConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await client.instance.request<
      T,
      AxiosResponse<T>,
      unknown
    >({
      ...config,
      ...options,
      baseURL: trustedRoot,
    });
    return response.data;
  };
}

function configuredMutator(): Mutator {
  const configuredRoot = apiBaseUrlFromEnv(import.meta.env);
  const parsed = new URL(configuredRoot);
  if (parsed.pathname !== "/") {
    throw new Error(
      "VITE_API_URL precisa apontar somente para origem raiz da API.",
    );
  }
  const trustedRoot = parsed.origin;
  const client = createHttpClient(trustedRoot);
  return createApiMutator(client, trustedRoot);
}

let sharedMutator: Mutator | null = null;

export const transportApi = <T>(
  config: MutatorConfig,
  options?: MutatorConfig,
): Promise<T> => {
  sharedMutator ??= configuredMutator();
  return sharedMutator<T>(config, options);
};
