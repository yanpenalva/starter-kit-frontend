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
  AuthenticationExceptionResponse,
  MfaEnrollmentConfirm200,
  MfaEnrollmentConfirm400,
  MfaEnrollmentConfirmBody,
  MfaEnrollmentEnroll200,
  MfaEnrollmentEnrollBody,
  MfaEnrollmentRegenerateRecoveryCodes200,
  MfaEnrollmentRegenerateRecoveryCodes400,
  MfaEnrollmentStatus200,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const mfaEnrollmentStatus = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<MfaEnrollmentStatus200>(
    { url: `/api/v1/auth/mfa/status`, method: "GET", signal },
    options,
  );
};

export const getMfaEnrollmentStatusQueryKey = () => {
  return ["api", "v1", "auth", "mfa", "status"] as const;
};

export const getMfaEnrollmentStatusQueryOptions = <
  TData = Awaited<ReturnType<typeof mfaEnrollmentStatus>>,
  TError = ErrorType<AuthenticationExceptionResponse>,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof mfaEnrollmentStatus>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof transportApi>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getMfaEnrollmentStatusQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof mfaEnrollmentStatus>>
  > = ({ signal }) => mfaEnrollmentStatus(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof mfaEnrollmentStatus>>,
    TError,
    TData
  >;
};

export type MfaEnrollmentStatusQueryResult = NonNullable<
  Awaited<ReturnType<typeof mfaEnrollmentStatus>>
>;
export type MfaEnrollmentStatusQueryError =
  ErrorType<AuthenticationExceptionResponse>;

export function useMfaEnrollmentStatus<
  TData = Awaited<ReturnType<typeof mfaEnrollmentStatus>>,
  TError = ErrorType<AuthenticationExceptionResponse>,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof mfaEnrollmentStatus>>,
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
  const queryOptions = getMfaEnrollmentStatusQueryOptions(options);

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

export const mfaEnrollmentEnroll = (
  mfaEnrollmentEnrollBody: MaybeRefOrGetter<MfaEnrollmentEnrollBody>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  mfaEnrollmentEnrollBody = toValue(mfaEnrollmentEnrollBody);

  return transportApi<MfaEnrollmentEnroll200>(
    {
      url: `/api/v1/auth/mfa/enroll`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: mfaEnrollmentEnrollBody,
      signal,
    },
    options,
  );
};

export const getMfaEnrollmentEnrollMutationKey = () =>
  ["mfaEnrollmentEnroll"] as const;

export const getMfaEnrollmentEnrollMutationOptions = <
  TError = ErrorType<
    AuthenticationExceptionResponse | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof mfaEnrollmentEnroll>>,
    TError,
    MfaEnrollmentEnrollMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof mfaEnrollmentEnroll>>,
  TError,
  MfaEnrollmentEnrollMutationVariables,
  TContext
> => {
  const mutationKey = getMfaEnrollmentEnrollMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof mfaEnrollmentEnroll>>,
    MfaEnrollmentEnrollMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return mfaEnrollmentEnroll(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type MfaEnrollmentEnrollMutationResult = NonNullable<
  Awaited<ReturnType<typeof mfaEnrollmentEnroll>>
>;
export type MfaEnrollmentEnrollMutationBody = MfaEnrollmentEnrollBody;
export type MfaEnrollmentEnrollMutationError = ErrorType<
  AuthenticationExceptionResponse | ValidationExceptionResponse
>;
export type MfaEnrollmentEnrollMutationVariables = {
  data: MfaEnrollmentEnrollBody;
};

export const useMfaEnrollmentEnroll = <
  TError = ErrorType<
    AuthenticationExceptionResponse | ValidationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof mfaEnrollmentEnroll>>,
      TError,
      MfaEnrollmentEnrollMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof mfaEnrollmentEnroll>>,
  TError,
  MfaEnrollmentEnrollMutationVariables,
  TContext
> => {
  return useMutation(
    getMfaEnrollmentEnrollMutationOptions(options),
    queryClient,
  );
};
export const mfaEnrollmentConfirm = (
  mfaEnrollmentConfirmBody: MaybeRefOrGetter<MfaEnrollmentConfirmBody>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  mfaEnrollmentConfirmBody = toValue(mfaEnrollmentConfirmBody);

  return transportApi<MfaEnrollmentConfirm200>(
    {
      url: `/api/v1/auth/mfa/confirm`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: mfaEnrollmentConfirmBody,
      signal,
    },
    options,
  );
};

export const getMfaEnrollmentConfirmMutationKey = () =>
  ["mfaEnrollmentConfirm"] as const;

export const getMfaEnrollmentConfirmMutationOptions = <
  TError = ErrorType<
    | MfaEnrollmentConfirm400
    | AuthenticationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof mfaEnrollmentConfirm>>,
    TError,
    MfaEnrollmentConfirmMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof mfaEnrollmentConfirm>>,
  TError,
  MfaEnrollmentConfirmMutationVariables,
  TContext
> => {
  const mutationKey = getMfaEnrollmentConfirmMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof mfaEnrollmentConfirm>>,
    MfaEnrollmentConfirmMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return mfaEnrollmentConfirm(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type MfaEnrollmentConfirmMutationResult = NonNullable<
  Awaited<ReturnType<typeof mfaEnrollmentConfirm>>
>;
export type MfaEnrollmentConfirmMutationBody = MfaEnrollmentConfirmBody;
export type MfaEnrollmentConfirmMutationError = ErrorType<
  | MfaEnrollmentConfirm400
  | AuthenticationExceptionResponse
  | ValidationExceptionResponse
>;
export type MfaEnrollmentConfirmMutationVariables = {
  data: MfaEnrollmentConfirmBody;
};

export const useMfaEnrollmentConfirm = <
  TError = ErrorType<
    | MfaEnrollmentConfirm400
    | AuthenticationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof mfaEnrollmentConfirm>>,
      TError,
      MfaEnrollmentConfirmMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof mfaEnrollmentConfirm>>,
  TError,
  MfaEnrollmentConfirmMutationVariables,
  TContext
> => {
  return useMutation(
    getMfaEnrollmentConfirmMutationOptions(options),
    queryClient,
  );
};
export const mfaEnrollmentDisable = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<void>(
    { url: `/api/v1/auth/mfa/disable`, method: "POST", signal },
    options,
  );
};

export const getMfaEnrollmentDisableMutationKey = () =>
  ["mfaEnrollmentDisable"] as const;

export const getMfaEnrollmentDisableMutationOptions = <
  TError = ErrorType<AuthenticationExceptionResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof mfaEnrollmentDisable>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof mfaEnrollmentDisable>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = getMfaEnrollmentDisableMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof mfaEnrollmentDisable>>,
    void
  > = () => {
    return mfaEnrollmentDisable(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type MfaEnrollmentDisableMutationResult = NonNullable<
  Awaited<ReturnType<typeof mfaEnrollmentDisable>>
>;

export type MfaEnrollmentDisableMutationError =
  ErrorType<AuthenticationExceptionResponse>;

export const useMfaEnrollmentDisable = <
  TError = ErrorType<AuthenticationExceptionResponse>,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof mfaEnrollmentDisable>>,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof mfaEnrollmentDisable>>,
  TError,
  void,
  TContext
> => {
  return useMutation(
    getMfaEnrollmentDisableMutationOptions(options),
    queryClient,
  );
};
export const mfaEnrollmentRegenerateRecoveryCodes = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<MfaEnrollmentRegenerateRecoveryCodes200>(
    { url: `/api/v1/auth/mfa/recovery-codes`, method: "POST", signal },
    options,
  );
};

export const getMfaEnrollmentRegenerateRecoveryCodesMutationKey = () =>
  ["mfaEnrollmentRegenerateRecoveryCodes"] as const;

export const getMfaEnrollmentRegenerateRecoveryCodesMutationOptions = <
  TError = ErrorType<
    MfaEnrollmentRegenerateRecoveryCodes400 | AuthenticationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof mfaEnrollmentRegenerateRecoveryCodes>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof mfaEnrollmentRegenerateRecoveryCodes>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = getMfaEnrollmentRegenerateRecoveryCodesMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof mfaEnrollmentRegenerateRecoveryCodes>>,
    void
  > = () => {
    return mfaEnrollmentRegenerateRecoveryCodes(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type MfaEnrollmentRegenerateRecoveryCodesMutationResult = NonNullable<
  Awaited<ReturnType<typeof mfaEnrollmentRegenerateRecoveryCodes>>
>;

export type MfaEnrollmentRegenerateRecoveryCodesMutationError = ErrorType<
  MfaEnrollmentRegenerateRecoveryCodes400 | AuthenticationExceptionResponse
>;

export const useMfaEnrollmentRegenerateRecoveryCodes = <
  TError = ErrorType<
    MfaEnrollmentRegenerateRecoveryCodes400 | AuthenticationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof mfaEnrollmentRegenerateRecoveryCodes>>,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof mfaEnrollmentRegenerateRecoveryCodes>>,
  TError,
  void,
  TContext
> => {
  return useMutation(
    getMfaEnrollmentRegenerateRecoveryCodesMutationOptions(options),
    queryClient,
  );
};
