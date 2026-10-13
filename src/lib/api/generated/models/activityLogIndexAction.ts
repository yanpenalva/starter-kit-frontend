/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type ActivityLogIndexAction =
  (typeof ActivityLogIndexAction)[keyof typeof ActivityLogIndexAction] | null;

export const ActivityLogIndexAction = {
  userstore: "user.store",
  userupdate: "user.update",
  userdestroy: "user.destroy",
  userstatus: "user.status",
  userassign_roles: "user.assign_roles",
  rolestore: "role.store",
  roleupdate_permissions: "role.update_permissions",
  roledestroy: "role.destroy",
  rolerename: "role.rename",
  adminbootstrap: "admin.bootstrap",
} as const;
