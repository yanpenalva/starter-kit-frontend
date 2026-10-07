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

import { toValue, unref } from "vue";
import type { MaybeRefOrGetter } from "vue";

import type {
  ActivityLogIndex200,
  ActivityLogIndexParams,
  AuthenticationExceptionResponse,
  AuthorizationExceptionResponse,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const activityLogIndex = (
  params?: MaybeRefOrGetter<ActivityLogIndexParams>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  params = toValue(params);

  return transportApi<ActivityLogIndex200>(
    { url: `/api/v1/activity-log`, method: "GET", params, signal },
    options,
  );
};

export const getActivityLogIndexQueryKey = (
  params?: MaybeRefOrGetter<ActivityLogIndexParams>,
) => {
  return ["api", "v1", "activity-log", ...(params ? [params] : [])] as const;
};

export const getActivityLogIndexQueryOptions = <
  TData = Awaited<ReturnType<typeof activityLogIndex>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
>(
  params?: MaybeRefOrGetter<ActivityLogIndexParams>,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof activityLogIndex>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof transportApi>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getActivityLogIndexQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof activityLogIndex>>
  > = ({ signal }) => activityLogIndex(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof activityLogIndex>>,
    TError,
    TData
  >;
};

export type ActivityLogIndexQueryResult = NonNullable<
  Awaited<ReturnType<typeof activityLogIndex>>
>;
export type ActivityLogIndexQueryError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ValidationExceptionResponse
>;

export function useActivityLogIndex<
  TData = Awaited<ReturnType<typeof activityLogIndex>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
>(
  params?: MaybeRefOrGetter<ActivityLogIndexParams>,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof activityLogIndex>>,
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
  const queryOptions = getActivityLogIndexQueryOptions(params, options);

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
