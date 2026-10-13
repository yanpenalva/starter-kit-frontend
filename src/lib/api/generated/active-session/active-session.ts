/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import { useMutation, useQuery } from "@tanstack/vue-query";
import type {
  DataTag,
  MutationFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationReturnType,
  UseQueryOptions,
  UseQueryReturnType,
} from "@tanstack/vue-query";

import { toValue, unref } from "vue";
import type { MaybeRefOrGetter } from "vue";

import type {
  ActiveSessionDestroy401,
  ActiveSessionDestroy403,
  ActiveSessionDestroy404,
  ActiveSessionDestroy419,
  ActiveSessionDestroy429,
  ActiveSessionDestroyOthers401,
  ActiveSessionDestroyOthers403,
  ActiveSessionDestroyOthers419,
  ActiveSessionDestroyOthers429,
  ActiveSessionIndex200,
  ActiveSessionIndex401,
  ActiveSessionIndex403,
  ActiveSessionIndex429,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const activeSessionIndex = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<ActiveSessionIndex200>(
    { url: `/api/v1/auth/sessions`, method: "GET", signal },
    options,
  );
};

export const getActiveSessionIndexQueryKey = () => {
  return ["api", "v1", "auth", "sessions"] as const;
};

export const getActiveSessionIndexQueryOptions = <
  TData = Awaited<ReturnType<typeof activeSessionIndex>>,
  TError = ErrorType<
    ActiveSessionIndex401 | ActiveSessionIndex403 | ActiveSessionIndex429
  >,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof activeSessionIndex>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof transportApi>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getActiveSessionIndexQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof activeSessionIndex>>
  > = ({ signal }) => activeSessionIndex(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof activeSessionIndex>>,
    TError,
    TData
  >;
};

export type ActiveSessionIndexQueryResult = NonNullable<
  Awaited<ReturnType<typeof activeSessionIndex>>
>;
export type ActiveSessionIndexQueryError = ErrorType<
  ActiveSessionIndex401 | ActiveSessionIndex403 | ActiveSessionIndex429
>;

export function useActiveSessionIndex<
  TData = Awaited<ReturnType<typeof activeSessionIndex>>,
  TError = ErrorType<
    ActiveSessionIndex401 | ActiveSessionIndex403 | ActiveSessionIndex429
  >,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof activeSessionIndex>>,
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
  const queryOptions = getActiveSessionIndexQueryOptions(options);

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

export const activeSessionDestroyOthers = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<void>(
    { url: `/api/v1/auth/sessions`, method: "DELETE", signal },
    options,
  );
};

export const getActiveSessionDestroyOthersMutationKey = () =>
  ["activeSessionDestroyOthers"] as const;

export const getActiveSessionDestroyOthersMutationOptions = <
  TError = ErrorType<
    | ActiveSessionDestroyOthers401
    | ActiveSessionDestroyOthers403
    | ActiveSessionDestroyOthers419
    | ActiveSessionDestroyOthers429
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof activeSessionDestroyOthers>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof activeSessionDestroyOthers>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = getActiveSessionDestroyOthersMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof activeSessionDestroyOthers>>,
    void
  > = () => {
    return activeSessionDestroyOthers(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type ActiveSessionDestroyOthersMutationResult = NonNullable<
  Awaited<ReturnType<typeof activeSessionDestroyOthers>>
>;

export type ActiveSessionDestroyOthersMutationError = ErrorType<
  | ActiveSessionDestroyOthers401
  | ActiveSessionDestroyOthers403
  | ActiveSessionDestroyOthers419
  | ActiveSessionDestroyOthers429
>;

export const useActiveSessionDestroyOthers = <
  TError = ErrorType<
    | ActiveSessionDestroyOthers401
    | ActiveSessionDestroyOthers403
    | ActiveSessionDestroyOthers419
    | ActiveSessionDestroyOthers429
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof activeSessionDestroyOthers>>,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof activeSessionDestroyOthers>>,
  TError,
  void,
  TContext
> => {
  return useMutation(
    getActiveSessionDestroyOthersMutationOptions(options),
    queryClient,
  );
};
export const activeSessionDestroy = (
  id: MaybeRefOrGetter<string>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  id = toValue(id);

  return transportApi<void>(
    { url: `/api/v1/auth/sessions/${id}`, method: "DELETE", signal },
    options,
  );
};

export const getActiveSessionDestroyMutationKey = () =>
  ["activeSessionDestroy"] as const;

export const getActiveSessionDestroyMutationOptions = <
  TError = ErrorType<
    | ActiveSessionDestroy401
    | ActiveSessionDestroy403
    | ActiveSessionDestroy404
    | ActiveSessionDestroy419
    | ActiveSessionDestroy429
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof activeSessionDestroy>>,
    TError,
    ActiveSessionDestroyMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof activeSessionDestroy>>,
  TError,
  ActiveSessionDestroyMutationVariables,
  TContext
> => {
  const mutationKey = getActiveSessionDestroyMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof activeSessionDestroy>>,
    ActiveSessionDestroyMutationVariables
  > = (props) => {
    const { id } = props ?? {};

    return activeSessionDestroy(id, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type ActiveSessionDestroyMutationResult = NonNullable<
  Awaited<ReturnType<typeof activeSessionDestroy>>
>;

export type ActiveSessionDestroyMutationError = ErrorType<
  | ActiveSessionDestroy401
  | ActiveSessionDestroy403
  | ActiveSessionDestroy404
  | ActiveSessionDestroy419
  | ActiveSessionDestroy429
>;
export type ActiveSessionDestroyMutationVariables = { id: string };

export const useActiveSessionDestroy = <
  TError = ErrorType<
    | ActiveSessionDestroy401
    | ActiveSessionDestroy403
    | ActiveSessionDestroy404
    | ActiveSessionDestroy419
    | ActiveSessionDestroy429
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof activeSessionDestroy>>,
      TError,
      ActiveSessionDestroyMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof activeSessionDestroy>>,
  TError,
  ActiveSessionDestroyMutationVariables,
  TContext
> => {
  return useMutation(
    getActiveSessionDestroyMutationOptions(options),
    queryClient,
  );
};
