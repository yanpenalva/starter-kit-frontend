/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActiveSessionIndex403Reason } from "./activeSessionIndex403Reason.ts";

export type ActiveSessionIndex403 = {
  message: string;
  reason: ActiveSessionIndex403Reason;
  /** @nullable */
  email_verified_at: string | null;
};
