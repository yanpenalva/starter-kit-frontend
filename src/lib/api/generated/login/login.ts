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
  AuthLogin401,
  AuthLogin403,
  AuthLogin419,
  AuthLogin429,
  LoginRequest,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authLogin = (
  loginRequest: MaybeRefOrGetter<LoginRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  loginRequest = toValue(loginRequest);

  return transportApi<void>(
    {
      url: `/api/v1/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: loginRequest,
      signal,
    },
    options,
  );
};

export const getAuthLoginMutationKey = () => ["authLogin"] as const;

export const getAuthLoginMutationOptions = <
  TError = ErrorType<
    | AuthLogin401
    | AuthLogin403
    | AuthLogin419
    | ValidationExceptionResponse
    | AuthLogin429
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authLogin>>,
    TError,
    AuthLoginMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authLogin>>,
  TError,
  AuthLoginMutationVariables,
  TContext
> => {
  const mutationKey = getAuthLoginMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authLogin>>,
    AuthLoginMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return authLogin(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthLoginMutationResult = NonNullable<
  Awaited<ReturnType<typeof authLogin>>
>;
export type AuthLoginMutationBody = LoginRequest;
export type AuthLoginMutationError = ErrorType<
  | AuthLogin401
  | AuthLogin403
  | AuthLogin419
  | ValidationExceptionResponse
  | AuthLogin429
>;
export type AuthLoginMutationVariables = { data: LoginRequest };

export const useAuthLogin = <
  TError = ErrorType<
    | AuthLogin401
    | AuthLogin403
    | AuthLogin419
    | ValidationExceptionResponse
    | AuthLogin429
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof authLogin>>,
      TError,
      AuthLoginMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof authLogin>>,
  TError,
  AuthLoginMutationVariables,
  TContext
> => {
  return useMutation(getAuthLoginMutationOptions(options), queryClient);
};
