/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { AuthMyProfile403Reason } from "./authMyProfile403Reason.ts";

export type AuthMyProfile403 = {
  message: string;
  reason: AuthMyProfile403Reason;
  /** @nullable */
  email_verified_at: string | null;
};
