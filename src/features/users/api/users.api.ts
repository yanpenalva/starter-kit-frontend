import { transportApi } from "@/lib/http/orval-mutator";
import type { Paginated } from "@/shared/types/contract";
import type {
  AdminUser,
  AssignUserRolesPayload,
  SetUserStatusPayload,
  UpdateUserPayload,
  UserFilters,
} from "./users.types";

export function listUsers(
  filters: UserFilters = {},
): Promise<Paginated<AdminUser>> {
  return transportApi<Paginated<AdminUser>>({
    url: "/api/v1/users",
    method: "GET",
    params: filters,
  });
}

export function showUser(userId: number): Promise<{ data: AdminUser }> {
  return transportApi<{ data: AdminUser }>({
    url: `/api/v1/users/${userId}`,
    method: "GET",
  });
}

export function updateUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<{ data: AdminUser }> {
  return transportApi<{ data: AdminUser }>({
    url: `/api/v1/users/${userId}`,
    method: "PATCH",
    data: payload,
  });
}

export function setUserStatus(
  userId: number,
  payload: SetUserStatusPayload,
): Promise<{ data: AdminUser }> {
  return transportApi<{ data: AdminUser }>({
    url: `/api/v1/users/${userId}/status`,
    method: "POST",
    data: payload,
  });
}

export function assignUserRoles(
  userId: number,
  payload: AssignUserRolesPayload,
): Promise<{ data: AdminUser }> {
  return transportApi<{ data: AdminUser }>({
    url: `/api/v1/users/${userId}/roles`,
    method: "PUT",
    data: payload,
  });
}
