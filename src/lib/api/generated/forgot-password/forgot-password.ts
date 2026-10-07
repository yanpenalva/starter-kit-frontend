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
  PasswordEmail202,
  PasswordEmail429,
  PasswordEmailBody,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const passwordEmail = (
  passwordEmailBody: MaybeRefOrGetter<PasswordEmailBody>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  passwordEmailBody = toValue(passwordEmailBody);

  return transportApi<PasswordEmail202>(
    {
      url: `/api/v1/forgot-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: passwordEmailBody,
      signal,
    },
    options,
  );
};

export const getPasswordEmailMutationKey = () => ["passwordEmail"] as const;

export const getPasswordEmailMutationOptions = <
  TError = ErrorType<ValidationExceptionResponse | PasswordEmail429>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof passwordEmail>>,
    TError,
    PasswordEmailMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof passwordEmail>>,
  TError,
  PasswordEmailMutationVariables,
  TContext
> => {
  const mutationKey = getPasswordEmailMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof passwordEmail>>,
    PasswordEmailMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return passwordEmail(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type PasswordEmailMutationResult = NonNullable<
  Awaited<ReturnType<typeof passwordEmail>>
>;
export type PasswordEmailMutationBody = PasswordEmailBody;
export type PasswordEmailMutationError = ErrorType<
  ValidationExceptionResponse | PasswordEmail429
>;
export type PasswordEmailMutationVariables = { data: PasswordEmailBody };

export const usePasswordEmail = <
  TError = ErrorType<ValidationExceptionResponse | PasswordEmail429>,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof passwordEmail>>,
      TError,
      PasswordEmailMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof passwordEmail>>,
  TError,
  PasswordEmailMutationVariables,
  TContext
> => {
  return useMutation(getPasswordEmailMutationOptions(options), queryClient);
};
