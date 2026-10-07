import { transportApi } from "@/lib/http/orval-mutator";
import type { Paginated } from "@/shared/types/contract";
import type {
  AdminRole,
  RoleFilters,
  UpdateRolePermissionsPayload,
} from "./roles.types";
export const listRoles = (
  filters: RoleFilters = {},
): Promise<Paginated<AdminRole>> => {
  return transportApi<Paginated<AdminRole>>({
    url: "/api/v1/roles",
    method: "GET",
    params: filters,
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
