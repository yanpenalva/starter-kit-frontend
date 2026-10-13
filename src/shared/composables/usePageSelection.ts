import { computed, onScopeDispose, ref, watch } from "vue";
import type { ComputedRef } from "vue";

export interface PageSelectionOptions {
  visibleIds: () => readonly number[];

  enabled?: () => boolean;

  scopeKey?: () => unknown;
}

export interface PageSelection {
  readonly selectedIds: ComputedRef<readonly number[]>;
  readonly selectedCount: ComputedRef<number>;

  readonly isSelectable: ComputedRef<boolean>;
  readonly isAllSelected: ComputedRef<boolean>;
  readonly isIndeterminate: ComputedRef<boolean>;
  isSelected: (id: number) => boolean;

  setSelected: (id: number, value: boolean) => void;

  toggleAll: (value?: boolean) => void;

  reconcile: () => void;
  clear: () => void;
}

export const usePageSelection = (
  options: PageSelectionOptions,
): PageSelection => {
  const selected = ref<number[]>([]);

  const visibleIds = computed<readonly number[]>(() => options.visibleIds());
  const visibleSet = computed(() => new Set(visibleIds.value));
  const selectedSet = computed(() => new Set(selected.value));
  const enabled = computed(() => options.enabled?.() ?? true);

  const selectedIds = computed<readonly number[]>(() => selected.value);
  const selectedCount = computed(() => selected.value.length);
  const isSelectable = computed(
    () => enabled.value && visibleIds.value.length > 0,
  );
  const isAllSelected = computed(
    () =>
      visibleIds.value.length > 0 &&
      visibleIds.value.every((id) => selectedSet.value.has(id)),
  );
  const isIndeterminate = computed(
    () => selectedCount.value > 0 && !isAllSelected.value,
  );

  const isSelected = (id: number): boolean => selectedSet.value.has(id);

  const setSelected = (id: number, value: boolean): void => {
    if (!visibleSet.value.has(id)) {
      return;
    }
    if (!value) {
      if (selectedSet.value.has(id)) {
        selected.value = selected.value.filter((candidate) => candidate !== id);
      }
      return;
    }
    if (isSelectable.value && !selectedSet.value.has(id)) {
      selected.value = [...selected.value, id];
    }
  };

  const toggleAll = (value?: boolean): void => {
    if (!isSelectable.value) {
      return;
    }
    const shouldSelect = value ?? !isAllSelected.value;
    selected.value = shouldSelect ? [...visibleIds.value] : [];
  };

  const reconcile = (): void => {
    const present = visibleSet.value;
    const next = selected.value.filter((id) => present.has(id));
    if (next.length !== selected.value.length) {
      selected.value = next;
    }
  };

  const clear = (): void => {
    if (selected.value.length > 0) {
      selected.value = [];
    }
  };

  watch(visibleIds, reconcile);
  if (options.scopeKey !== undefined) {
    watch(options.scopeKey, clear);
  }
  onScopeDispose(clear);

  return {
    selectedIds,
    selectedCount,
    isSelectable,
    isAllSelected,
    isIndeterminate,
    isSelected,
    setSelected,
    toggleAll,
    reconcile,
    clear,
  };
};
