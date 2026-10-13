/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ActiveSessionDestroyOthers403Reason } from "./activeSessionDestroyOthers403Reason.ts";

export type ActiveSessionDestroyOthers403 = {
  message: string;
  reason: ActiveSessionDestroyOthers403Reason;
  /** @nullable */
  email_verified_at: string | null;
};
