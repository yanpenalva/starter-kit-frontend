/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type UpdateRolePermissionsRequestPermissionsItem =
  (typeof UpdateRolePermissionsRequestPermissionsItem)[keyof typeof UpdateRolePermissionsRequestPermissionsItem];

export const UpdateRolePermissionsRequestPermissionsItem = {
  usersview: "users.view",
  usersupdate: "users.update",
  "usersset-status": "users.set-status",
  "usersassign-roles": "users.assign-roles",
  "usersread-cpf": "users.read-cpf",
  usersmanage: "users.manage",
  rolesview: "roles.view",
  "rolesupdate-permissions": "roles.update-permissions",
  rolesmanage: "roles.manage",
  logsview: "logs.view",
} as const;
