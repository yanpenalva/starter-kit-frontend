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
  AuthorizationExceptionResponse,
  ModelNotFoundExceptionResponse,
  RoleIndex200,
  RoleIndexParams,
  RoleUpdatePermissions200,
  UpdateRolePermissionsRequest,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const roleIndex = (
  params?: MaybeRefOrGetter<RoleIndexParams>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  params = toValue(params);

  return transportApi<RoleIndex200>(
    { url: `/api/v1/roles`, method: "GET", params, signal },
    options,
  );
};

export const getRoleIndexQueryKey = (
  params?: MaybeRefOrGetter<RoleIndexParams>,
) => {
  return ["api", "v1", "roles", ...(params ? [params] : [])] as const;
};

export const getRoleIndexQueryOptions = <
  TData = Awaited<ReturnType<typeof roleIndex>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
>(
  params?: MaybeRefOrGetter<RoleIndexParams>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof roleIndex>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getRoleIndexQueryKey(params);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof roleIndex>>> = ({
    signal,
  }) => roleIndex(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof roleIndex>>,
    TError,
    TData
  >;
};

export type RoleIndexQueryResult = NonNullable<
  Awaited<ReturnType<typeof roleIndex>>
>;
export type RoleIndexQueryError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ValidationExceptionResponse
>;

export function useRoleIndex<
  TData = Awaited<ReturnType<typeof roleIndex>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
>(
  params?: MaybeRefOrGetter<RoleIndexParams>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof roleIndex>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getRoleIndexQueryOptions(params, options);

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

export const roleUpdatePermissions = (
  role: MaybeRefOrGetter<number>,
  updateRolePermissionsRequest: MaybeRefOrGetter<UpdateRolePermissionsRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  role = toValue(role);
  updateRolePermissionsRequest = toValue(updateRolePermissionsRequest);

  return transportApi<RoleUpdatePermissions200>(
    {
      url: `/api/v1/roles/${role}/permissions`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: updateRolePermissionsRequest,
      signal,
    },
    options,
  );
};

export const getRoleUpdatePermissionsMutationKey = () =>
  ["roleUpdatePermissions"] as const;

export const getRoleUpdatePermissionsMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof roleUpdatePermissions>>,
    TError,
    RoleUpdatePermissionsMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof roleUpdatePermissions>>,
  TError,
  RoleUpdatePermissionsMutationVariables,
  TContext
> => {
  const mutationKey = getRoleUpdatePermissionsMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof roleUpdatePermissions>>,
    RoleUpdatePermissionsMutationVariables
  > = (props) => {
    const { role, data } = props ?? {};

    return roleUpdatePermissions(role, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type RoleUpdatePermissionsMutationResult = NonNullable<
  Awaited<ReturnType<typeof roleUpdatePermissions>>
>;
export type RoleUpdatePermissionsMutationBody = UpdateRolePermissionsRequest;
export type RoleUpdatePermissionsMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
  | ValidationExceptionResponse
>;
export type RoleUpdatePermissionsMutationVariables = {
  role: number;
  data: UpdateRolePermissionsRequest;
};

export const useRoleUpdatePermissions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof roleUpdatePermissions>>,
      TError,
      RoleUpdatePermissionsMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof roleUpdatePermissions>>,
  TError,
  RoleUpdatePermissionsMutationVariables,
  TContext
> => {
  return useMutation(
    getRoleUpdatePermissionsMutationOptions(options),
    queryClient,
  );
};
