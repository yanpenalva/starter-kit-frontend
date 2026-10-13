/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type ActiveSessionDestroy403Reason =
  (typeof ActiveSessionDestroy403Reason)[keyof typeof ActiveSessionDestroy403Reason];

export const ActiveSessionDestroy403Reason = {
  pending_approval: "pending_approval",
  suspended: "suspended",
} as const;
