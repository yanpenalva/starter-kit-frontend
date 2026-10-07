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
  AuthRegister201,
  AuthRegister419,
  AuthRegister429,
  AuthRegister503,
  RegisterRequest,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authRegister = (
  registerRequest: MaybeRefOrGetter<RegisterRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  registerRequest = toValue(registerRequest);

  return transportApi<AuthRegister201>(
    {
      url: `/api/v1/register`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: registerRequest,
      signal,
    },
    options,
  );
};

export const getAuthRegisterMutationKey = () => ["authRegister"] as const;

export const getAuthRegisterMutationOptions = <
  TError = ErrorType<
    | AuthRegister419
    | ValidationExceptionResponse
    | AuthRegister429
    | AuthRegister503
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authRegister>>,
    TError,
    AuthRegisterMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authRegister>>,
  TError,
  AuthRegisterMutationVariables,
  TContext
> => {
  const mutationKey = getAuthRegisterMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authRegister>>,
    AuthRegisterMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return authRegister(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthRegisterMutationResult = NonNullable<
  Awaited<ReturnType<typeof authRegister>>
>;
export type AuthRegisterMutationBody = RegisterRequest;
export type AuthRegisterMutationError = ErrorType<
  | AuthRegister419
  | ValidationExceptionResponse
  | AuthRegister429
  | AuthRegister503
>;
export type AuthRegisterMutationVariables = { data: RegisterRequest };

export const useAuthRegister = <
  TError = ErrorType<
    | AuthRegister419
    | ValidationExceptionResponse
    | AuthRegister429
    | AuthRegister503
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof authRegister>>,
      TError,
      AuthRegisterMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof authRegister>>,
  TError,
  AuthRegisterMutationVariables,
  TContext
> => {
  return useMutation(getAuthRegisterMutationOptions(options), queryClient);
};
