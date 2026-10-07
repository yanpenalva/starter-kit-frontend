/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { UpdateRolePermissionsRequestPermissionsItem } from "./updateRolePermissionsRequestPermissionsItem.ts";

/**
 * Wave B contract: replace a role's permission set with catalogue
 * permissions. The wave owning the route enforces RolePolicy::updatePermissions
 * (admin role immutable) for the resolved role inside a PrivilegeTransaction.
 */
export interface UpdateRolePermissionsRequest {
  /** @minItems 1 */
  permissions: UpdateRolePermissionsRequestPermissionsItem[];
}
