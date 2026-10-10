export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export const USER_STATUSES = ["active", "deactivated"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CATALOGUE_ROLES = ["admin", "user"] as const;
export type CatalogueRole = (typeof CATALOGUE_ROLES)[number];

export const CATALOGUE_PERMISSIONS = [
  "users.view",
  "users.update",
  "users.set-status",
  "users.assign-roles",
  "users.manage",
  "users.read-cpf",
  "roles.view",
  "roles.update-permissions",
  "roles.manage",
  "logs.view",
] as const;
export type CataloguePermission = (typeof CATALOGUE_PERMISSIONS)[number];

export const CATALOGUE_PERMISSION_LABELS: Readonly<
  Record<CataloguePermission, string>
> = {
  "users.view": "Ver usuários",
  "users.update": "Editar usuários",
  "users.set-status": "Ativar/desativar contas",
  "users.assign-roles": "Atribuir papéis",
  "users.manage": "Criar/excluir usuários",
  "users.read-cpf": "Ler CPF",
  "roles.view": "Ver papéis",
  "roles.update-permissions": "Editar permissões de papéis",
  "roles.manage": "Criar/excluir papéis",
  "logs.view": "Ver auditoria",
};
