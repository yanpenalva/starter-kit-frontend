import { computed, reactive } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  listRoles,
  updateRolePermissions,
} from "@/features/roles/api/roles.api";
import type {
  RoleFilters,
  UpdateRolePermissionsPayload,
} from "@/features/roles/api/roles.types";

export const ROLES_QUERY_KEY = "roles";

export const useRolesList = () => {
  const queryClient = useQueryClient();
  const filters = reactive<RoleFilters>({ page: 1, per_page: 15, search: "" });
  const query = useQuery({
    queryKey: computed(() => [ROLES_QUERY_KEY, { ...filters }]),
    queryFn: () => listRoles({ ...filters }),
  });
  const permissionMutation = useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: number;
      payload: UpdateRolePermissionsPayload;
    }) => updateRolePermissions(roleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
    },
  });
  return { filters, query, permissionMutation };
};
