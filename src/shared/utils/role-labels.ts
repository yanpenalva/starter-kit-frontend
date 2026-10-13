export const ROLE_LABELS: Readonly<Record<string, string>> = {
  admin: "Administrador",
  auditor: "Auditor",
  manager: "Gerente",
  support: "Suporte",
  user: "Usuário",
};

export const roleLabel = (slug: string): string => ROLE_LABELS[slug] ?? slug;
