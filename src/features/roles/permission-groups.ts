import {
  CATALOGUE_PERMISSIONS,
  type CataloguePermission,
} from "@/shared/types/contract";

export interface PermissionGroup {
  readonly id: string;
  readonly label: string;
  readonly permissions: readonly CataloguePermission[];
}

const GROUP_LABELS: Readonly<Record<string, string>> = {
  users: "Usuários",
  roles: "Perfis",
  logs: "Auditoria",
};

const buildGroups = (): readonly PermissionGroup[] => {
  const groups: { id: string; permissions: CataloguePermission[] }[] = [];

  for (const permission of CATALOGUE_PERMISSIONS) {
    const domain = permission.split(".")[0] ?? permission;
    let group = groups.find((candidate) => candidate.id === domain);
    if (group === undefined) {
      group = { id: domain, permissions: [] };
      groups.push(group);
    }
    group.permissions.push(permission);
  }

  return groups.map((group) => ({
    id: group.id,
    label: GROUP_LABELS[group.id] ?? group.id,
    permissions: group.permissions,
  }));
};

export const PERMISSION_GROUPS: readonly PermissionGroup[] = buildGroups();
