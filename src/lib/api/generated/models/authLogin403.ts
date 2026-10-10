/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { AuthLogin403Reason } from "./authLogin403Reason.ts";

export type AuthLogin403 = {
  message: string;
  reason: AuthLogin403Reason;
  /** @nullable */
  email_verified_at: string | null;
};
