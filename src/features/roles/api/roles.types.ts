import type { CataloguePermission } from "@/shared/types/contract";

export interface AdminRole {
  id: number;
  name: string;
  guard_name: string;
  permissions: CataloguePermission[];
}

export interface RoleFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface UpdateRolePermissionsPayload {
  permissions: CataloguePermission[];
}

export const IMMUTABLE_ROLE = "admin";

export function isRoleImmutable(role: AdminRole): boolean {
  return role.name === IMMUTABLE_ROLE;
}
