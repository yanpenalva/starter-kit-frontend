/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActivityLogIndexEvent } from "./activityLogIndexEvent.ts";
import type { ActivityLogIndexSubjectType } from "./activityLogIndexSubjectType.ts";

export type ActivityLogIndexParams = {
  /**
   * @minimum 1
   */
  page?: number;
  /**
   * @minimum 1
   * @maximum 100
   */
  per_page?: number;
  event?: ActivityLogIndexEvent;
  subject_type?: ActivityLogIndexSubjectType;
  from?: string;
  to?: string;
  /**
   * @minimum 1
   */
  causer_id?: number;
};
