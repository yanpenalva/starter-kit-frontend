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
  VerificationSend202,
  VerificationSend401,
  VerificationSend429,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const verificationSend = (
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  return transportApi<VerificationSend202>(
    { url: `/api/v1/email/verification-notification`, method: "POST", signal },
    options,
  );
};

export const getVerificationSendMutationKey = () =>
  ["verificationSend"] as const;

export const getVerificationSendMutationOptions = <
  TError = ErrorType<VerificationSend401 | VerificationSend429>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof verificationSend>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof verificationSend>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = getVerificationSendMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof verificationSend>>,
    void
  > = () => {
    return verificationSend(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type VerificationSendMutationResult = NonNullable<
  Awaited<ReturnType<typeof verificationSend>>
>;

export type VerificationSendMutationError = ErrorType<
  VerificationSend401 | VerificationSend429
>;

export const useVerificationSend = <
  TError = ErrorType<VerificationSend401 | VerificationSend429>,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof verificationSend>>,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof verificationSend>>,
  TError,
  void,
  TContext
> => {
  return useMutation(getVerificationSendMutationOptions(options), queryClient);
};
