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

import type { Health200, Health503 } from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const health = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<Health200>(
    { url: `/api/v1/health`, method: "GET", signal },
    options,
  );
};

export const getHealthQueryKey = () => {
  return ["api", "v1", "health"] as const;
};

export const getHealthQueryOptions = <
  TData = Awaited<ReturnType<typeof health>>,
  TError = ErrorType<Health503>,
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof health>>, TError, TData>
  >;
  request?: SecondParameter<typeof transportApi>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getHealthQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof health>>> = ({
    signal,
  }) => health(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof health>>,
    TError,
    TData
  >;
};

export type HealthQueryResult = NonNullable<Awaited<ReturnType<typeof health>>>;
export type HealthQueryError = ErrorType<Health503>;

export function useHealth<
  TData = Awaited<ReturnType<typeof health>>,
  TError = ErrorType<Health503>,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof health>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getHealthQueryOptions(options);

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
