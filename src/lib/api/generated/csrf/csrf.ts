/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import { useQuery } from "@tanstack/vue-query";
import type {
  DataTag,
  QueryClient,
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryReturnType,
} from "@tanstack/vue-query";

import { unref } from "vue";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * Emite o cookie XSRF-TOKEN e o cookie de sessão HttpOnly (starter-kit-api-session) para a SPA. Público; nenhuma autenticação necessária.
 */
export const sanctumCsrfCookie = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<void>(
    { url: `/sanctum/csrf-cookie`, method: "GET", signal },
    options,
  );
};

export const getSanctumCsrfCookieQueryKey = () => {
  return ["sanctum", "csrf-cookie"] as const;
};

export const getSanctumCsrfCookieQueryOptions = <
  TData = Awaited<ReturnType<typeof sanctumCsrfCookie>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof sanctumCsrfCookie>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof transportApi>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getSanctumCsrfCookieQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof sanctumCsrfCookie>>
  > = ({ signal }) => sanctumCsrfCookie(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof sanctumCsrfCookie>>,
    TError,
    TData
  >;
};

export type SanctumCsrfCookieQueryResult = NonNullable<
  Awaited<ReturnType<typeof sanctumCsrfCookie>>
>;
export type SanctumCsrfCookieQueryError = ErrorType<unknown>;

export function useSanctumCsrfCookie<
  TData = Awaited<ReturnType<typeof sanctumCsrfCookie>>,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof sanctumCsrfCookie>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getSanctumCsrfCookieQueryOptions(options);

  const query = useQuery(queryOptions, queryClient) as UseQueryReturnType<
    TData,
    TError
  > & { queryKey: DataTag<QueryKey, TData, TError> };

  query.queryKey = unref(queryOptions).queryKey as DataTag<
    QueryKey,
    TData,
    TError
  >;

  return query;
}
