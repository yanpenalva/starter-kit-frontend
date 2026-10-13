/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

/**
 * Grant ceiling: a non-admin actor may only assign roles whose permissions are
 * all held by the actor (directly or through the actor's roles). The role list
 * is evaluated as a whole — if any requested role exceeds the ceiling (or is
 * the admin role), nothing is assigned. Policy denials, including the ceiling,
 * respond 403 Forbidden with the unauthorized message; unknown role names are
 * rejected earlier by validation with 422.
 */
export interface AssignUserRolesRequest {
  /** @minItems 1 */
  roles: string[];
}
