/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type RoleIndexParams = {
  /**
   * @minimum 1
   */
  page?: number;
  /**
   * @minimum 1
   * @maximum 100
   */
  per_page?: number;
  /**
   * @maxLength 255
   */
  search?: string;
};
