/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export interface UpdatePasswordRequest {
  current_password: string;
  /**
   * @minLength 12
   * @maxLength 255
   */
  password: string;
  /**
   * @minLength 12
   * @maxLength 255
   */
  password_confirmation: string;
}
