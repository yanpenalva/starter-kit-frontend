/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
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
