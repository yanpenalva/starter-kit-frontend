import { computed, reactive } from "vue";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import {
  assignUserRoles,
  createUser,
  deleteUser,
  listUsers,
  setUserStatus,
  showUser,
  updateUser,
} from "@/features/users/api/users.api";
import type { StoreUserRequest } from "@/lib/api/generated/models/storeUserRequest";
import type {
  AssignUserRolesPayload,
  SetUserStatusPayload,
  UpdateUserPayload,
  UserFilters,
} from "@/features/users/api/users.types";
export const USERS_QUERY_KEY = "users";
export const USER_QUERY_KEY = "user";

export const useUserMutations = () => {
  const queryClient = useQueryClient();
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
  const createMutation = useMutation({
    mutationFn: (payload: StoreUserRequest) => createUser(payload),
    onSuccess: () => invalidate(),
  });
  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => invalidate(),
  });
  return {
    updateMutation,
    statusMutation,
    rolesMutation,
    createMutation,
    deleteMutation,
  };
};

export const useUsersList = () => {
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
    placeholderData: keepPreviousData,
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
  return {
    filters,
    query,
    ...useUserMutations(),
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
