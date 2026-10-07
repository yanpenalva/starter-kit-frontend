import { computed, reactive, watch } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  assignUserRoles,
  listUsers,
  setUserStatus,
  showUser,
  updateUser,
} from "@/features/users/api/users.api";
import type {
  AssignUserRolesPayload,
  SetUserStatusPayload,
  UpdateUserPayload,
  UserFilters,
} from "@/features/users/api/users.types";
export const USERS_QUERY_KEY = "users";
export const USER_QUERY_KEY = "user";
export const useUsersList = () => {
  const queryClient = useQueryClient();
  const filters = reactive<UserFilters>({
    page: 1,
    per_page: 15,
    search: "",
    status: undefined,
    role: undefined,
  });
  const query = useQuery({
    queryKey: computed(() => [USERS_QUERY_KEY, { ...filters }]),
    queryFn: () => listUsers({ ...filters }),
  });
  const hasActiveFilters = (): boolean => {
    return (
      filters.search !== "" ||
      filters.status !== undefined ||
      filters.role !== undefined
    );
  };
  const resetAndGoToFirstPage = (): void => {
    filters.page = 1;
  };
  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    await queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
  };
  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: UpdateUserPayload;
    }) => updateUser(userId, payload),
    onSuccess: () => invalidate(),
  });
  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: SetUserStatusPayload;
    }) => setUserStatus(userId, payload),
    onSuccess: () => invalidate(),
  });
  const rolesMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: AssignUserRolesPayload;
    }) => assignUserRoles(userId, payload),
    onSuccess: () => invalidate(),
  });
  return {
    filters,
    query,
    updateMutation,
    statusMutation,
    rolesMutation,
    hasActiveFilters,
    resetAndGoToFirstPage,
  };
};
export const useUserDetail = (userId: () => number | null) => {
  return useQuery({
    queryKey: computed(() => [USER_QUERY_KEY, userId()]),
    queryFn: () => showUser(userId() as number),
    enabled: computed(() => userId() !== null),
  });
};
export const usersSearchDebounce = (
  filters: UserFilters,
  apply: (value: string) => void,
  delayMs = 350,
): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const stop = watch(
    () => filters.search,
    (value) => {
      if (value === undefined) {
        return;
      }
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => apply(value), delayMs);
    },
  );
  return () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    stop();
  };
};
