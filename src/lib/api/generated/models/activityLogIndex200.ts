/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActivityLogIndex200Links } from "./activityLogIndex200Links.ts";
import type { ActivityLogIndex200Meta } from "./activityLogIndex200Meta.ts";
import type { ActivityResource } from "./activityResource.ts";

export type ActivityLogIndex200 = {
  data: ActivityResource[];
  links?: ActivityLogIndex200Links;
  meta?: ActivityLogIndex200Meta;
};
