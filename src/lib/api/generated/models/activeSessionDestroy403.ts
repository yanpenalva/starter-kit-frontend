/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActiveSessionDestroy403Reason } from "./activeSessionDestroy403Reason.ts";

export type ActiveSessionDestroy403 = {
  message: string;
  reason: ActiveSessionDestroy403Reason;
  /** @nullable */
  email_verified_at: string | null;
};
