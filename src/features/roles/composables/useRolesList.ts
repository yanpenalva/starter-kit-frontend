import { computed, reactive } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createRole,
  deleteRole,
  listRoles,
  updateRolePermissions,
} from "@/features/roles/api/roles.api";
import type {
  RoleFilters,
  UpdateRolePermissionsPayload,
} from "@/features/roles/api/roles.types";

export const ROLES_QUERY_KEY = "roles";

export const useRoleMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
  };
  const permissionMutation = useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: number;
      payload: UpdateRolePermissionsPayload;
    }) => updateRolePermissions(roleId, payload),
    onSuccess: () => invalidate(),
  });
  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) => createRole(payload),
    onSuccess: () => invalidate(),
  });
  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => deleteRole(roleId),
    onSuccess: () => invalidate(),
  });
  return { permissionMutation, createMutation, deleteMutation };
};

export const useRolesList = () => {
  const filters = reactive<RoleFilters>({ page: 1, per_page: 15, search: "" });
  const query = useQuery({
    queryKey: computed(() => [ROLES_QUERY_KEY, { ...filters }]),
    queryFn: () => listRoles({ ...filters }),
  });
  return { filters, query, ...useRoleMutations() };
};
