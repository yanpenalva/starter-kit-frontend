import { computed, reactive } from "vue";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import {
  createRole,
  deleteRole,
  listRoles,
  renameRole,
  updateRolePermissions,
} from "@/features/roles/api/roles.api";
import type {
  RoleFilters,
  UpdateRolePermissionsPayload,
} from "@/features/roles/api/roles.types";
import {
  USER_QUERY_KEY,
  USERS_QUERY_KEY,
} from "@/features/users/composables/useUsersList";

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
  const renameMutation = useMutation({
    mutationFn: ({ roleId, name }: { roleId: number; name: string }) =>
      renameRole(roleId, { name }),
    onSuccess: async () => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }),
      ]);
    },
  });
  return { permissionMutation, createMutation, deleteMutation, renameMutation };
};

export const useRolesList = () => {
  const filters = reactive<RoleFilters>({ page: 1, per_page: 15, search: "" });
  const query = useQuery({
    queryKey: computed(() => [ROLES_QUERY_KEY, { ...filters }]),
    queryFn: () => listRoles({ ...filters }),
    placeholderData: keepPreviousData,
  });
  return { filters, query, ...useRoleMutations() };
};
