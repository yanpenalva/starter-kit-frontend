/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export interface RegisterRequest {
  /** @maxLength 255 */
  name: string;
  /** @maxLength 255 */
  email: string;
  password: string;
  /** @nullable */
  cpf?: string | null;
  password_confirmation: string;
}
