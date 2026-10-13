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

import { computed, toValue, unref } from "vue";
import type { MaybeRefOrGetter } from "vue";

import type {
  AuthenticationExceptionResponse,
  AuthorizationExceptionResponse,
  ModelNotFoundExceptionResponse,
  RenameRoleRequest,
  RoleIndex200,
  RoleIndexParams,
  RoleRename200,
  RoleShow200,
  RoleStore201,
  RoleUpdatePermissions200,
  StoreRoleRequest,
  UpdateRolePermissionsRequest,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const roleStore = (
  storeRoleRequest: MaybeRefOrGetter<StoreRoleRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  storeRoleRequest = toValue(storeRoleRequest);

  return transportApi<RoleStore201>(
    {
      url: `/api/v1/roles`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: storeRoleRequest,
      signal,
    },
    options,
  );
};

export const getRoleStoreMutationKey = () => ["roleStore"] as const;

export const getRoleStoreMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof roleStore>>,
    TError,
    RoleStoreMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof roleStore>>,
  TError,
  RoleStoreMutationVariables,
  TContext
> => {
  const mutationKey = getRoleStoreMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof roleStore>>,
    RoleStoreMutationVariables
  > = (props) => {
    const { data } = props ?? {};

    return roleStore(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type RoleStoreMutationResult = NonNullable<
  Awaited<ReturnType<typeof roleStore>>
>;
export type RoleStoreMutationBody = StoreRoleRequest;
export type RoleStoreMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ValidationExceptionResponse
>;
export type RoleStoreMutationVariables = { data: StoreRoleRequest };

export const useRoleStore = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof roleStore>>,
      TError,
      RoleStoreMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof roleStore>>,
  TError,
  RoleStoreMutationVariables,
  TContext
> => {
  return useMutation(getRoleStoreMutationOptions(options), queryClient);
};
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

export const roleShow = (
  role: MaybeRefOrGetter<number>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  role = toValue(role);

  return transportApi<RoleShow200>(
    { url: `/api/v1/roles/${role}`, method: "GET", signal },
    options,
  );
};

export const getRoleShowQueryKey = (role: MaybeRefOrGetter<number>) => {
  return ["api", "v1", "roles", role] as const;
};

export const getRoleShowQueryOptions = <
  TData = Awaited<ReturnType<typeof roleShow>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
  >,
>(
  role: MaybeRefOrGetter<number>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof roleShow>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getRoleShowQueryKey(role);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof roleShow>>> = ({
    signal,
  }) => roleShow(role, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: computed(
      () => toValue(role) !== null && toValue(role) !== undefined,
    ),
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof roleShow>>, TError, TData>;
};

export type RoleShowQueryResult = NonNullable<
  Awaited<ReturnType<typeof roleShow>>
>;
export type RoleShowQueryError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
>;

export function useRoleShow<
  TData = Awaited<ReturnType<typeof roleShow>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
  >,
>(
  role: MaybeRefOrGetter<number>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof roleShow>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getRoleShowQueryOptions(role, options);

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

export const roleRename = (
  role: MaybeRefOrGetter<number>,
  renameRoleRequest: MaybeRefOrGetter<RenameRoleRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  role = toValue(role);
  renameRoleRequest = toValue(renameRoleRequest);

  return transportApi<RoleRename200>(
    {
      url: `/api/v1/roles/${role}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: renameRoleRequest,
      signal,
    },
    options,
  );
};

export const getRoleRenameMutationKey = () => ["roleRename"] as const;

export const getRoleRenameMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof roleRename>>,
    TError,
    RoleRenameMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof roleRename>>,
  TError,
  RoleRenameMutationVariables,
  TContext
> => {
  const mutationKey = getRoleRenameMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof roleRename>>,
    RoleRenameMutationVariables
  > = (props) => {
    const { role, data } = props ?? {};

    return roleRename(role, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type RoleRenameMutationResult = NonNullable<
  Awaited<ReturnType<typeof roleRename>>
>;
export type RoleRenameMutationBody = RenameRoleRequest;
export type RoleRenameMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
  | ValidationExceptionResponse
>;
export type RoleRenameMutationVariables = {
  role: number;
  data: RenameRoleRequest;
};

export const useRoleRename = <
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
      Awaited<ReturnType<typeof roleRename>>,
      TError,
      RoleRenameMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof roleRename>>,
  TError,
  RoleRenameMutationVariables,
  TContext
> => {
  return useMutation(getRoleRenameMutationOptions(options), queryClient);
};
export const roleDestroy = (
  role: MaybeRefOrGetter<number>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  role = toValue(role);

  return transportApi<string[]>(
    { url: `/api/v1/roles/${role}`, method: "DELETE", signal },
    options,
  );
};

export const getRoleDestroyMutationKey = () => ["roleDestroy"] as const;

export const getRoleDestroyMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof roleDestroy>>,
    TError,
    RoleDestroyMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof roleDestroy>>,
  TError,
  RoleDestroyMutationVariables,
  TContext
> => {
  const mutationKey = getRoleDestroyMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof roleDestroy>>,
    RoleDestroyMutationVariables
  > = (props) => {
    const { role } = props ?? {};

    return roleDestroy(role, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type RoleDestroyMutationResult = NonNullable<
  Awaited<ReturnType<typeof roleDestroy>>
>;

export type RoleDestroyMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
>;
export type RoleDestroyMutationVariables = { role: number };

export const useRoleDestroy = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
  >,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof roleDestroy>>,
      TError,
      RoleDestroyMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof roleDestroy>>,
  TError,
  RoleDestroyMutationVariables,
  TContext
> => {
  return useMutation(getRoleDestroyMutationOptions(options), queryClient);
};
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
