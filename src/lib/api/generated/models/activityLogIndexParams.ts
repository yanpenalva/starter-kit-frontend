/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActivityLogIndexAction } from "./activityLogIndexAction.ts";
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
  /**
   * @nullable
   */
  event?: ActivityLogIndexEvent;
  /**
   * @nullable
   */
  action?: ActivityLogIndexAction;
  /**
   * @maxLength 255
   * @nullable
   */
  search?: string | null;
  /**
   * @nullable
   */
  subject_type?: ActivityLogIndexSubjectType;
  /**
   * @nullable
   */
  from?: string | null;
  /**
   * @nullable
   */
  to?: string | null;
  /**
   * @minimum 1
   * @nullable
   */
  causer_id?: number | null;
};
