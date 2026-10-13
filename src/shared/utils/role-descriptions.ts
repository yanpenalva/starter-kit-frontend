import type { CataloguePermission } from "@/shared/types/contract";

export const ROLE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  admin: "Acesso administrativo ao sistema",
  auditor: "Consulta registros e acompanha atividades",
  manager: "Gerencia usuários e operações",
  support: "Apoia usuários e resolve solicitações",
  user: "Acessa os recursos básicos da conta",
};

export const roleDescription = (
  name: string,
  permissions: readonly CataloguePermission[],
): string =>
  ROLE_DESCRIPTIONS[name] ??
  `Perfil personalizado — ${permissions.length} permissões`;
