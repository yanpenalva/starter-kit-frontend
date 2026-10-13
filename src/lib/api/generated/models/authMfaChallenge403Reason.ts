/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type AuthMfaChallenge403Reason =
  (typeof AuthMfaChallenge403Reason)[keyof typeof AuthMfaChallenge403Reason];

export const AuthMfaChallenge403Reason = {
  suspended: "suspended",
  pending_approval: "pending_approval",
} as const;
