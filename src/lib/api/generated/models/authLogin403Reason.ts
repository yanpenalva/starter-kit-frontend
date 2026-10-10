/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type AuthLogin403Reason =
  (typeof AuthLogin403Reason)[keyof typeof AuthLogin403Reason];

export const AuthLogin403Reason = {
  pending_approval: "pending_approval",
  suspended: "suspended",
} as const;
