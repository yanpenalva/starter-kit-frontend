import { transportApi } from "@/lib/http/orval-mutator";
import type { Paginated } from "@/shared/types/contract";
import type {
  AdminRole,
  RoleFilters,
  UpdateRolePermissionsPayload,
} from "./roles.types";

const omitEmpty = <T extends object>(filters: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  ) as Partial<T>;
};

export const listRoles = (
  filters: RoleFilters = {},
): Promise<Paginated<AdminRole>> => {
  return transportApi<Paginated<AdminRole>>({
    url: "/api/v1/roles",
    method: "GET",
    params: omitEmpty(filters),
  });
};
export const createRole = (payload: {
  name: string;
}): Promise<{
  data: AdminRole;
}> => {
  return transportApi<{
    data: AdminRole;
  }>({
    url: "/api/v1/roles",
    method: "POST",
    data: payload,
  });
};
export const deleteRole = (roleId: number): Promise<void> => {
  return transportApi<void>({
    url: `/api/v1/roles/${roleId}`,
    method: "DELETE",
  });
};
export const renameRole = (
  roleId: number,
  payload: { name: string },
): Promise<{
  data: AdminRole;
}> => {
  return transportApi<{
    data: AdminRole;
  }>({
    url: `/api/v1/roles/${roleId}`,
    method: "PATCH",
    data: payload,
  });
};
export const updateRolePermissions = (
  roleId: number,
  payload: UpdateRolePermissionsPayload,
): Promise<{
  data: AdminRole;
}> => {
  return transportApi<{
    data: AdminRole;
  }>({
    url: `/api/v1/roles/${roleId}/permissions`,
    method: "PUT",
    data: payload,
  });
};
