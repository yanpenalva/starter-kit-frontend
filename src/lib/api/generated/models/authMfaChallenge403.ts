/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { AuthMfaChallenge403Reason } from "./authMfaChallenge403Reason.ts";

export type AuthMfaChallenge403 = {
  message: "Esta conta foi desativada.";
  reason: AuthMfaChallenge403Reason;
  /** @nullable */
  email_verified_at: string | null;
};
