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
  AuthUpdateMyProfile200,
  AuthenticationExceptionResponse,
  AuthorizationExceptionResponse,
  UpdateMyProfileRequest,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authUpdateMyProfile = (
  updateMyProfileRequest?: MaybeRefOrGetter<UpdateMyProfileRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  updateMyProfileRequest = toValue(updateMyProfileRequest);

  return transportApi<AuthUpdateMyProfile200>(
    {
      url: `/api/v1/auth/my-profile`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateMyProfileRequest,
      signal,
    },
    options,
  );
};

export const getAuthUpdateMyProfileMutationKey = () =>
  ["authUpdateMyProfile"] as const;

export const getAuthUpdateMyProfileMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authUpdateMyProfile>>,
    TError,
    AuthUpdateMyProfileMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authUpdateMyProfile>>,
  TError,
  AuthUpdateMyProfileMutationVariables,
  TContext
> => {
  const mutationKey = getAuthUpdateMyProfileMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authUpdateMyProfile>>,
    AuthUpdateMyProfileMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return authUpdateMyProfile(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthUpdateMyProfileMutationResult = NonNullable<
  Awaited<ReturnType<typeof authUpdateMyProfile>>
>;
export type AuthUpdateMyProfileMutationBody =
  UpdateMyProfileRequest | undefined;
export type AuthUpdateMyProfileMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ValidationExceptionResponse
>;
export type AuthUpdateMyProfileMutationVariables = {
  data?: UpdateMyProfileRequest;
};

export const useAuthUpdateMyProfile = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof authUpdateMyProfile>>,
      TError,
      AuthUpdateMyProfileMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof authUpdateMyProfile>>,
  TError,
  AuthUpdateMyProfileMutationVariables,
  TContext
> => {
  return useMutation(
    getAuthUpdateMyProfileMutationOptions(options),
    queryClient,
  );
};
