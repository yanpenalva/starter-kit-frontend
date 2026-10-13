/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import { useMutation } from "@tanstack/vue-query";
import type {
  MutationFunction,
  QueryClient,
  UseMutationOptions,
  UseMutationReturnType,
} from "@tanstack/vue-query";

import { toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";

import type {
  AuthUpdatePassword200,
  AuthenticationExceptionResponse,
  AuthorizationExceptionResponse,
  UpdatePasswordRequest,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authUpdatePassword = (
  updatePasswordRequest: MaybeRefOrGetter<UpdatePasswordRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  updatePasswordRequest = toValue(updatePasswordRequest);

  return transportApi<AuthUpdatePassword200>(
    {
      url: `/api/v1/auth/password`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: updatePasswordRequest,
      signal,
    },
    options,
  );
};

export const getAuthUpdatePasswordMutationKey = () =>
  ["authUpdatePassword"] as const;

export const getAuthUpdatePasswordMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authUpdatePassword>>,
    TError,
    AuthUpdatePasswordMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authUpdatePassword>>,
  TError,
  AuthUpdatePasswordMutationVariables,
  TContext
> => {
  const mutationKey = getAuthUpdatePasswordMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authUpdatePassword>>,
    AuthUpdatePasswordMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return authUpdatePassword(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthUpdatePasswordMutationResult = NonNullable<
  Awaited<ReturnType<typeof authUpdatePassword>>
>;
export type AuthUpdatePasswordMutationBody = UpdatePasswordRequest;
export type AuthUpdatePasswordMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ValidationExceptionResponse
>;
export type AuthUpdatePasswordMutationVariables = {
  data: UpdatePasswordRequest;
};

export const useAuthUpdatePassword = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof authUpdatePassword>>,
      TError,
      AuthUpdatePasswordMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof authUpdatePassword>>,
  TError,
  AuthUpdatePasswordMutationVariables,
  TContext
> => {
  return useMutation(
    getAuthUpdatePasswordMutationOptions(options),
    queryClient,
  );
};
