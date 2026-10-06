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

import type { AuthLogout401, AuthLogout419, AuthLogout429 } from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authLogout = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<void>(
    { url: `/api/v1/logout`, method: "POST", signal },
    options,
  );
};

export const getAuthLogoutMutationKey = () => ["authLogout"] as const;

export const getAuthLogoutMutationOptions = <
  TError = ErrorType<AuthLogout401 | AuthLogout419 | AuthLogout429>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authLogout>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authLogout>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = getAuthLogoutMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authLogout>>,
    void
  > = () => {
    return authLogout(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthLogoutMutationResult = NonNullable<
  Awaited<ReturnType<typeof authLogout>>
>;

export type AuthLogoutMutationError = ErrorType<
  AuthLogout401 | AuthLogout419 | AuthLogout429
>;

export const useAuthLogout = <
  TError = ErrorType<AuthLogout401 | AuthLogout419 | AuthLogout429>,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof authLogout>>,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof authLogout>>,
  TError,
  void,
  TContext
> => {
  return useMutation(getAuthLogoutMutationOptions(options), queryClient);
};
