import type { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  buildHttpError,
  createHttpClient,
  resolveEnvironmentConfig,
} from "@/lib/http";
import type { HttpClient, HttpError } from "@/lib/http";

export type ErrorType<T = unknown> = HttpError & {
  readonly contractError?: T;
};

type MutatorConfig = AxiosRequestConfig<unknown>;
type Mutator = <T>(
  config: MutatorConfig,
  options?: MutatorConfig,
) => Promise<T>;

function isTrustedRoot(value: unknown, trustedRoot: string): boolean {
  if (typeof value !== "string" || value !== trustedRoot) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return (
      parsed.origin === trustedRoot &&
      parsed.pathname === "/" &&
      parsed.search === "" &&
      parsed.hash === ""
    );
  } catch {
    return false;
  }
}

function hasTrustedBaseURL(
  config: MutatorConfig | undefined,
  trustedRoot: string,
): boolean {
  if (config === undefined || !Object.hasOwn(config, "baseURL")) {
    return true;
  }
  const descriptor = Object.getOwnPropertyDescriptor(config, "baseURL");
  if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) {
    return false;
  }
  return isTrustedRoot(descriptor.value, trustedRoot);
}

export function createApiMutator(
  client: HttpClient,
  trustedRoot: string,
): Mutator {
  return async function transportApi<T>(
    config: MutatorConfig,
    options?: MutatorConfig,
  ): Promise<T> {
    const configBaseURLIsTrusted = hasTrustedBaseURL(config, trustedRoot);
    const optionsBaseURLIsTrusted = hasTrustedBaseURL(options, trustedRoot);
    if (!configBaseURLIsTrusted || !optionsBaseURLIsTrusted) {
      throw buildHttpError({ kind: "unexpected" });
    }
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
  const envConfig = resolveEnvironmentConfig(import.meta.env);
  const parsed = new URL(envConfig.apiBaseUrl);
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
