/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActivityResourceProperties } from "./activityResourceProperties.ts";

export interface ActivityResource {
  id: number;
  event: string;
  subject_type: string;
  subject_id: number;
  description: string;
  properties: ActivityResourceProperties;
  /** @nullable */
  created_at: string | null;
}
