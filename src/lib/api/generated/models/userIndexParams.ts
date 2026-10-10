/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { UserIndexStatus } from "./userIndexStatus.ts";

export type UserIndexParams = {
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
   * @nullable
   */
  search?: string | null;
  /**
   * @nullable
   */
  status?: UserIndexStatus;
  /**
   * @maxLength 64
   * @nullable
   */
  role?: string | null;
};
