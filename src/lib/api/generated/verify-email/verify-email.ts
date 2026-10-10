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

import { computed, toValue, unref } from "vue";
import type { MaybeRefOrGetter } from "vue";

import type {
  ModelNotFoundExceptionResponse,
  VerificationVerify200,
  VerificationVerify401,
  VerificationVerify403,
  VerificationVerify429,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const verificationVerify = (
  id: MaybeRefOrGetter<string>,
  hash: MaybeRefOrGetter<string>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  id = toValue(id);
  hash = toValue(hash);

  return transportApi<VerificationVerify200>(
    { url: `/api/v1/email/verify/${id}/${hash}`, method: "GET", signal },
    options,
  );
};

export const getVerificationVerifyQueryKey = (
  id: MaybeRefOrGetter<string>,
  hash: MaybeRefOrGetter<string>,
) => {
  return ["api", "v1", "email", "verify", id, hash] as const;
};

export const getVerificationVerifyQueryOptions = <
  TData = Awaited<ReturnType<typeof verificationVerify>>,
  TError = ErrorType<
    | void
    | VerificationVerify401
    | VerificationVerify403
    | ModelNotFoundExceptionResponse
    | VerificationVerify429
  >,
>(
  id: MaybeRefOrGetter<string>,
  hash: MaybeRefOrGetter<string>,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof verificationVerify>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof transportApi>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getVerificationVerifyQueryKey(id, hash);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof verificationVerify>>
  > = ({ signal }) => verificationVerify(id, hash, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: computed(
      () =>
        toValue(id) !== null &&
        toValue(id) !== undefined &&
        toValue(hash) !== null &&
        toValue(hash) !== undefined,
    ),
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof verificationVerify>>,
    TError,
    TData
  >;
};

export type VerificationVerifyQueryResult = NonNullable<
  Awaited<ReturnType<typeof verificationVerify>>
>;
export type VerificationVerifyQueryError = ErrorType<
  | void
  | VerificationVerify401
  | VerificationVerify403
  | ModelNotFoundExceptionResponse
  | VerificationVerify429
>;

export function useVerificationVerify<
  TData = Awaited<ReturnType<typeof verificationVerify>>,
  TError = ErrorType<
    | void
    | VerificationVerify401
    | VerificationVerify403
    | ModelNotFoundExceptionResponse
    | VerificationVerify429
  >,
>(
  id: MaybeRefOrGetter<string>,
  hash: MaybeRefOrGetter<string>,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof verificationVerify>>,
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
  const queryOptions = getVerificationVerifyQueryOptions(id, hash, options);

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
