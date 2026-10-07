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
  AssignUserRolesRequest,
  AuthenticationExceptionResponse,
  AuthorizationExceptionResponse,
  ModelNotFoundExceptionResponse,
  SetUserStatusRequest,
  UpdateUserRequest,
  UserAssignRoles200,
  UserIndex200,
  UserIndexParams,
  UserSetStatus200,
  UserShow200,
  UserUpdate200,
  ValidationExceptionResponse,
} from "../models";

import { transportApi } from "../../../http/orval-mutator.ts";
import type { ErrorType } from "../../../http/orval-mutator.ts";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const userIndex = (
  params?: MaybeRefOrGetter<UserIndexParams>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  params = toValue(params);

  return transportApi<UserIndex200>(
    { url: `/api/v1/users`, method: "GET", params, signal },
    options,
  );
};

export const getUserIndexQueryKey = (
  params?: MaybeRefOrGetter<UserIndexParams>,
) => {
  return ["api", "v1", "users", ...(params ? [params] : [])] as const;
};

export const getUserIndexQueryOptions = <
  TData = Awaited<ReturnType<typeof userIndex>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
>(
  params?: MaybeRefOrGetter<UserIndexParams>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof userIndex>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getUserIndexQueryKey(params);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof userIndex>>> = ({
    signal,
  }) => userIndex(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof userIndex>>,
    TError,
    TData
  >;
};

export type UserIndexQueryResult = NonNullable<
  Awaited<ReturnType<typeof userIndex>>
>;
export type UserIndexQueryError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ValidationExceptionResponse
>;

export function useUserIndex<
  TData = Awaited<ReturnType<typeof userIndex>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ValidationExceptionResponse
  >,
>(
  params?: MaybeRefOrGetter<UserIndexParams>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof userIndex>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getUserIndexQueryOptions(params, options);

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

export const userShow = (
  user: MaybeRefOrGetter<number>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  user = toValue(user);

  return transportApi<UserShow200>(
    { url: `/api/v1/users/${user}`, method: "GET", signal },
    options,
  );
};

export const getUserShowQueryKey = (user: MaybeRefOrGetter<number>) => {
  return ["api", "v1", "users", user] as const;
};

export const getUserShowQueryOptions = <
  TData = Awaited<ReturnType<typeof userShow>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
  >,
>(
  user: MaybeRefOrGetter<number>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof userShow>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = getUserShowQueryKey(user);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof userShow>>> = ({
    signal,
  }) => userShow(user, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: computed(
      () => toValue(user) !== null && toValue(user) !== undefined,
    ),
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof userShow>>, TError, TData>;
};

export type UserShowQueryResult = NonNullable<
  Awaited<ReturnType<typeof userShow>>
>;
export type UserShowQueryError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
>;

export function useUserShow<
  TData = Awaited<ReturnType<typeof userShow>>,
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
  >,
>(
  user: MaybeRefOrGetter<number>,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof userShow>>, TError, TData>
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getUserShowQueryOptions(user, options);

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

export const userUpdate = (
  user: MaybeRefOrGetter<number>,
  updateUserRequest?: MaybeRefOrGetter<UpdateUserRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  user = toValue(user);
  updateUserRequest = toValue(updateUserRequest);

  return transportApi<UserUpdate200>(
    {
      url: `/api/v1/users/${user}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateUserRequest,
      signal,
    },
    options,
  );
};

export const getUserUpdateMutationKey = () => ["userUpdate"] as const;

export const getUserUpdateMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userUpdate>>,
    TError,
    UserUpdateMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof userUpdate>>,
  TError,
  UserUpdateMutationVariables,
  TContext
> => {
  const mutationKey = getUserUpdateMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof userUpdate>>,
    UserUpdateMutationVariables
  > = (props) => {
    const { user, data } = props ?? {};

    return userUpdate(user, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type UserUpdateMutationResult = NonNullable<
  Awaited<ReturnType<typeof userUpdate>>
>;
export type UserUpdateMutationBody = UpdateUserRequest | undefined;
export type UserUpdateMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
  | ValidationExceptionResponse
>;
export type UserUpdateMutationVariables = {
  user: number;
  data?: UpdateUserRequest;
};

export const useUserUpdate = <
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
      Awaited<ReturnType<typeof userUpdate>>,
      TError,
      UserUpdateMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof userUpdate>>,
  TError,
  UserUpdateMutationVariables,
  TContext
> => {
  return useMutation(getUserUpdateMutationOptions(options), queryClient);
};
export const userSetStatus = (
  user: MaybeRefOrGetter<number>,
  setUserStatusRequest: MaybeRefOrGetter<SetUserStatusRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  user = toValue(user);
  setUserStatusRequest = toValue(setUserStatusRequest);

  return transportApi<UserSetStatus200>(
    {
      url: `/api/v1/users/${user}/status`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: setUserStatusRequest,
      signal,
    },
    options,
  );
};

export const getUserSetStatusMutationKey = () => ["userSetStatus"] as const;

export const getUserSetStatusMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userSetStatus>>,
    TError,
    UserSetStatusMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof userSetStatus>>,
  TError,
  UserSetStatusMutationVariables,
  TContext
> => {
  const mutationKey = getUserSetStatusMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof userSetStatus>>,
    UserSetStatusMutationVariables
  > = (props) => {
    const { user, data } = props ?? {};

    return userSetStatus(user, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type UserSetStatusMutationResult = NonNullable<
  Awaited<ReturnType<typeof userSetStatus>>
>;
export type UserSetStatusMutationBody = SetUserStatusRequest;
export type UserSetStatusMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
  | ValidationExceptionResponse
>;
export type UserSetStatusMutationVariables = {
  user: number;
  data: SetUserStatusRequest;
};

export const useUserSetStatus = <
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
      Awaited<ReturnType<typeof userSetStatus>>,
      TError,
      UserSetStatusMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof userSetStatus>>,
  TError,
  UserSetStatusMutationVariables,
  TContext
> => {
  return useMutation(getUserSetStatusMutationOptions(options), queryClient);
};
export const userAssignRoles = (
  user: MaybeRefOrGetter<number>,
  assignUserRolesRequest: MaybeRefOrGetter<AssignUserRolesRequest>,
  options?: SecondParameter<typeof transportApi>,
  signal?: AbortSignal,
) => {
  user = toValue(user);
  assignUserRolesRequest = toValue(assignUserRolesRequest);

  return transportApi<UserAssignRoles200>(
    {
      url: `/api/v1/users/${user}/roles`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: assignUserRolesRequest,
      signal,
    },
    options,
  );
};

export const getUserAssignRolesMutationKey = () => ["userAssignRoles"] as const;

export const getUserAssignRolesMutationOptions = <
  TError = ErrorType<
    | AuthenticationExceptionResponse
    | AuthorizationExceptionResponse
    | ModelNotFoundExceptionResponse
    | ValidationExceptionResponse
  >,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userAssignRoles>>,
    TError,
    UserAssignRolesMutationVariables,
    TContext
  >;
  request?: SecondParameter<typeof transportApi>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof userAssignRoles>>,
  TError,
  UserAssignRolesMutationVariables,
  TContext
> => {
  const mutationKey = getUserAssignRolesMutationKey();
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof userAssignRoles>>,
    UserAssignRolesMutationVariables
  > = (props) => {
    const { user, data } = props ?? {};

    return userAssignRoles(user, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type UserAssignRolesMutationResult = NonNullable<
  Awaited<ReturnType<typeof userAssignRoles>>
>;
export type UserAssignRolesMutationBody = AssignUserRolesRequest;
export type UserAssignRolesMutationError = ErrorType<
  | AuthenticationExceptionResponse
  | AuthorizationExceptionResponse
  | ModelNotFoundExceptionResponse
  | ValidationExceptionResponse
>;
export type UserAssignRolesMutationVariables = {
  user: number;
  data: AssignUserRolesRequest;
};

export const useUserAssignRoles = <
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
      Awaited<ReturnType<typeof userAssignRoles>>,
      TError,
      UserAssignRolesMutationVariables,
      TContext
    >;
    request?: SecondParameter<typeof transportApi>;
  },
  queryClient?: QueryClient,
): UseMutationReturnType<
  Awaited<ReturnType<typeof userAssignRoles>>,
  TError,
  UserAssignRolesMutationVariables,
  TContext
> => {
  return useMutation(getUserAssignRolesMutationOptions(options), queryClient);
};
