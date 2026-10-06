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

import type {
  AuthMyProfile200,
  AuthMyProfile401,
  AuthMyProfile403,
  AuthMyProfile429,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authMyProfile = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<AuthMyProfile200>(
    { url: `/api/v1/auth/my-profile`, method: "GET", signal },
    options,
  );
};

export const getAuthMyProfileQueryKey = () => {
  return ["api", "v1", "auth", "my-profile"] as const;
};

export const getAuthMyProfileQueryOptions = <
  TData = Awaited<ReturnType<typeof authMyProfile>>,
  TError = ErrorType<AuthMyProfile401 | AuthMyProfile403 | AuthMyProfile429>,
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof authMyProfile>>, TError, TData>
  >;
  request?: SecondParameter<typeof transportApi>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getAuthMyProfileQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof authMyProfile>>> = ({
    signal,
  }) => authMyProfile(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof authMyProfile>>,
    TError,
    TData
  >;
};

export type AuthMyProfileQueryResult = NonNullable<
  Awaited<ReturnType<typeof authMyProfile>>
>;
export type AuthMyProfileQueryError = ErrorType<
  AuthMyProfile401 | AuthMyProfile403 | AuthMyProfile429
>;

export function useAuthMyProfile<
  TData = Awaited<ReturnType<typeof authMyProfile>>,
  TError = ErrorType<AuthMyProfile401 | AuthMyProfile403 | AuthMyProfile429>,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof authMyProfile>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getAuthMyProfileQueryOptions(options);

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
