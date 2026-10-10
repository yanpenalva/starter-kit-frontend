/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type AuthMyProfile403Reason =
  (typeof AuthMyProfile403Reason)[keyof typeof AuthMyProfile403Reason];

export const AuthMyProfile403Reason = {
  pending_approval: "pending_approval",
  suspended: "suspended",
} as const;
