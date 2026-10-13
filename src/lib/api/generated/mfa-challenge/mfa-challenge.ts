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

import type {
  AuthMfaChallenge401,
  AuthMfaChallenge403,
  AuthMfaChallenge422,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authMfaChallenge = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<void>(
    { url: `/api/v1/auth/mfa/challenge`, method: "POST", signal },
    options,
  );
};

export const getAuthMfaChallengeMutationKey = () =>
  ["authMfaChallenge"] as const;

export const getAuthMfaChallengeMutationOptions = <
  TError = ErrorType<
    AuthMfaChallenge401 | AuthMfaChallenge403 | AuthMfaChallenge422
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authMfaChallenge>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authMfaChallenge>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = getAuthMfaChallengeMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authMfaChallenge>>,
    void
  > = () => {
    return authMfaChallenge(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthMfaChallengeMutationResult = NonNullable<
  Awaited<ReturnType<typeof authMfaChallenge>>
>;

export type AuthMfaChallengeMutationError = ErrorType<
  AuthMfaChallenge401 | AuthMfaChallenge403 | AuthMfaChallenge422
>;

export const useAuthMfaChallenge = <
  TError = ErrorType<
    AuthMfaChallenge401 | AuthMfaChallenge403 | AuthMfaChallenge422
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof authMfaChallenge>>,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof authMfaChallenge>>,
  TError,
  void,
  TContext
> => {
  return useMutation(getAuthMfaChallengeMutationOptions(options), queryClient);
};
