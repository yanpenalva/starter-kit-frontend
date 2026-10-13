import { computed, ref } from "vue";
import type { Ref } from "vue";

export interface RoleOption {
  readonly id: number;
  readonly name: string;
}

type ListRolesFn = (filters: {
  page?: number;
  per_page?: number;
  search?: string;
}) => Promise<{
  data: RoleOption[];
  meta: { current_page: number; last_page: number; total: number };
}>;

export interface RoleOptionsController {
  readonly options: Ref<RoleOption[]>;
  readonly isLoading: Ref<boolean>;
  readonly hasMore: Ref<boolean>;
  search: (term: string) => void;
  loadMore: () => Promise<void>;
}

const DEBOUNCE_MS = 250;

export const useRoleOptions = (
  listRoles: ListRolesFn,
): RoleOptionsController => {
  const options = ref<RoleOption[]>([]);
  const isLoading = ref(false);
  const currentPage = ref(0);
  const lastPage = ref(1);
  const loadedIds = new Set<number>();
  let requestToken = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingTerm = "";
  let activeTerm = "";

  const hasMore = computed(() => currentPage.value < lastPage.value);

  const fetchPage = async (page: number): Promise<void> => {
    const token = ++requestToken;
    isLoading.value = true;
    try {
      const response = await listRoles({
        page,
        per_page: 50,
        search: activeTerm === "" ? undefined : activeTerm,
      });
      if (token !== requestToken) return;
      if (page === 1) {
        options.value = [];
        loadedIds.clear();
      }
      for (const role of response.data) {
        if (loadedIds.has(role.id)) continue;
        loadedIds.add(role.id);
        options.value = [...options.value, role];
      }
      currentPage.value = response.meta.current_page;
      lastPage.value = response.meta.last_page;
    } finally {
      if (token === requestToken) {
        isLoading.value = false;
      }
    }
  };

  void fetchPage(1);

  const search = (term: string): void => {
    pendingTerm = term.trim();
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (pendingTerm === activeTerm) return;
      activeTerm = pendingTerm;
      currentPage.value = 0;
      lastPage.value = 1;
      void fetchPage(1);
    }, DEBOUNCE_MS);
  };

  const loadMore = async (): Promise<void> => {
    if (isLoading.value || !hasMore.value) return;
    await fetchPage(currentPage.value + 1);
  };

  return { options, isLoading, hasMore, search, loadMore };
};
