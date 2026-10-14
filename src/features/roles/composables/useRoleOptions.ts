import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import type { CataloguePermission } from "@/shared/types/contract";

export interface RoleOption {
  readonly id: number;
  readonly name: string;
  readonly permissions: CataloguePermission[];
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
  readonly hasError: Ref<boolean>;
  readonly hasMore: Ref<boolean>;
  search: (term: string) => void;
  loadMore: () => Promise<void>;
  loadAll: () => Promise<void>;
  retry: () => Promise<void>;
}

const DEBOUNCE_MS = 250;

export const useRoleOptions = (
  listRoles: ListRolesFn,
  enabled: () => boolean = () => true,
): RoleOptionsController => {
  const options = ref<RoleOption[]>([]);
  const isLoading = ref(false);
  const hasError = ref(false);
  const currentPage = ref(0);
  const lastPage = ref(1);
  const loadedIds = new Set<number>();
  let requestToken = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingTerm = "";
  let activeTerm = "";

  const hasMore = computed(() => currentPage.value < lastPage.value);

  const fetchPage = async (page: number): Promise<void> => {
    if (!enabled()) return;
    const token = ++requestToken;
    isLoading.value = true;
    hasError.value = false;
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
        options.value = [
          ...options.value,
          { id: role.id, name: role.name, permissions: role.permissions },
        ];
      }
      currentPage.value = response.meta.current_page;
      lastPage.value = response.meta.last_page;
    } catch {
      if (token === requestToken) hasError.value = true;
    } finally {
      if (token === requestToken) {
        isLoading.value = false;
      }
    }
  };

  watch(
    enabled,
    (isEnabled) => {
      requestToken += 1;
      isLoading.value = false;
      if (isEnabled) void fetchPage(1);
    },
    { immediate: true },
  );

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

  const loadAll = async (): Promise<void> => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = null;
    pendingTerm = "";
    activeTerm = "";
    currentPage.value = 0;
    lastPage.value = 1;
    options.value = [];
    loadedIds.clear();
    await fetchPage(1);
    while (hasMore.value && !hasError.value && enabled()) {
      const nextPage = currentPage.value + 1;
      await loadMore();
      if (currentPage.value < nextPage || !enabled()) break;
    }
  };

  const retry = async (): Promise<void> => {
    await fetchPage(1);
  };

  return {
    options,
    isLoading,
    hasError,
    hasMore,
    search,
    loadMore,
    loadAll,
    retry,
  };
};
