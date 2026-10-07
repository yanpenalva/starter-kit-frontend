/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

/**
 * Wave B contract: update basic account attributes. The wave owning the
 * route enforces UserPolicy::update for the resolved target inside a
 * PrivilegeTransaction; this request carries only the actor ability gate
 * and the input shape.
 */
export interface UpdateUserRequest {
  /** @maxLength 255 */
  name?: string;
  /** @maxLength 254 */
  email?: string;
  /**
   * @nullable
   * @pattern ^\d{11}$
   */
  cpf?: string | null;
}
