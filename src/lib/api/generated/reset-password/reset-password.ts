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
  PasswordUpdate200,
  PasswordUpdate429,
  PasswordUpdateBody,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const passwordUpdate = (
  passwordUpdateBody: MaybeRefOrGetter<PasswordUpdateBody>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  passwordUpdateBody = toValue(passwordUpdateBody);

  return transportApi<PasswordUpdate200>(
    {
      url: `/api/v1/reset-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: passwordUpdateBody,
      signal,
    },
    options,
  );
};

export const getPasswordUpdateMutationKey = () => ["passwordUpdate"] as const;

export const getPasswordUpdateMutationOptions = <
  TError = ErrorType<ValidationExceptionResponse | PasswordUpdate429>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof passwordUpdate>>,
    TError,
    PasswordUpdateMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof passwordUpdate>>,
  TError,
  PasswordUpdateMutationVariables,
  TContext
> => {
  const mutationKey = getPasswordUpdateMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof passwordUpdate>>,
    PasswordUpdateMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return passwordUpdate(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type PasswordUpdateMutationResult = NonNullable<
  Awaited<ReturnType<typeof passwordUpdate>>
>;
export type PasswordUpdateMutationBody = PasswordUpdateBody;
export type PasswordUpdateMutationError = ErrorType<
  ValidationExceptionResponse | PasswordUpdate429
>;
export type PasswordUpdateMutationVariables = { data: PasswordUpdateBody };

export const usePasswordUpdate = <
  TError = ErrorType<ValidationExceptionResponse | PasswordUpdate429>,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof passwordUpdate>>,
      TError,
      PasswordUpdateMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof passwordUpdate>>,
  TError,
  PasswordUpdateMutationVariables,
  TContext
> => {
  return useMutation(getPasswordUpdateMutationOptions(options), queryClient);
};
