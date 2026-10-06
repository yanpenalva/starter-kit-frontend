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

import type { GetApiV1200 } from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getApiV1 = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<GetApiV1200>(
    { url: `/api/v1`, method: "GET", signal },
    options,
  );
};

export const getGetApiV1QueryKey = () => {
  return ["api", "v1"] as const;
};

export const getGetApiV1QueryOptions = <
  TData = Awaited<ReturnType<typeof getApiV1>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof getApiV1>>, TError, TData>
  >;
  request?: SecondParameter<typeof transportApi>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getGetApiV1QueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1>>> = ({
    signal,
  }) => getApiV1(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getApiV1>>,
    TError,
    TData
  >;
};

export type GetApiV1QueryResult = NonNullable<
  Awaited<ReturnType<typeof getApiV1>>
>;
export type GetApiV1QueryError = ErrorType<unknown>;

export function useGetApiV1<
  TData = Awaited<ReturnType<typeof getApiV1>>,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getApiV1>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getGetApiV1QueryOptions(options);

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
