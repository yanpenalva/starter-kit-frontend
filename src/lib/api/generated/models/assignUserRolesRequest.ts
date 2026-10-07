/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

/**
 * Wave B contract: replace the target's role set with catalogue roles. The
 * wave owning the route enforces UserPolicy::assignRoles (no self-assignment,
 * last active admin preserved) for the resolved target inside a
 * PrivilegeTransaction.
 */
export interface AssignUserRolesRequest {
  /** @minItems 1 */
  roles: string[];
}
