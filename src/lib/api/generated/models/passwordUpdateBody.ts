/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type PasswordUpdateBody = {
  /** @maxLength 255 */
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};
