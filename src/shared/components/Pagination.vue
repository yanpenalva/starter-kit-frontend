<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <nav
    class="ui-pagination"
    :aria-label="ariaLabel"
    :aria-busy="disabled ? 'true' : undefined"
  >
    <p class="ui-pagination__range">{{ rangeText }}</p>

    <div class="ui-pagination__controls">
      <span class="ui-pagination__status">
        Página {{ currentPage }} de {{ lastPage }}
      </span>

      <button
        v-if="lastPage > 2"
        type="button"
        class="ui-control"
        aria-label="Primeira página"
        :disabled="disabled || isFirstPage"
        @click="goTo(1)"
      >
        Primeira
      </button>

      <button
        type="button"
        class="ui-control"
        aria-label="Página anterior"
        :disabled="disabled || isFirstPage"
        @click="goTo(currentPage - 1)"
      >
        Anterior
      </button>

      <button
        type="button"
        class="ui-control"
        aria-label="Próxima página"
        :disabled="disabled || isLastPage"
        @click="goTo(currentPage + 1)"
      >
        Próxima
      </button>

      <button
        v-if="lastPage > 2"
        type="button"
        class="ui-control"
        aria-label="Última página"
        :disabled="disabled || isLastPage"
        @click="goTo(lastPage)"
      >
        Última
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PaginationMeta } from "@/shared/types/contract";

type PaginationSummary = Pick<
  PaginationMeta,
  "current_page" | "last_page" | "per_page" | "total"
>;

const props = withDefaults(
  defineProps<{
    meta: PaginationSummary;
    ariaLabel?: string;
    disabled?: boolean;
  }>(),
  { ariaLabel: "Paginação", disabled: false },
);

const emit = defineEmits<{
  change: [page: number];
}>();

const currentPage = computed(() => Math.max(1, props.meta.current_page));
const lastPage = computed(() => Math.max(1, props.meta.last_page));
const isFirstPage = computed(() => currentPage.value <= 1);
const isLastPage = computed(() => currentPage.value >= lastPage.value);

const rangeText = computed(() => {
  const total = Math.max(0, props.meta.total);
  if (total === 0) {
    return "0–0 de 0";
  }
  const perPage = Math.max(1, props.meta.per_page);
  const start = Math.min((currentPage.value - 1) * perPage + 1, total);
  const end = Math.min(currentPage.value * perPage, total);
  return `${start}–${end} de ${total}`;
});

const goTo = (page: number): void => {
  if (props.disabled) {
    return;
  }
  const target = Math.min(Math.max(page, 1), lastPage.value);
  if (target !== currentPage.value) {
    emit("change", target);
  }
};
</script>

<style scoped>
.ui-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin: 1rem 0 0;
  font-size: 0.875rem;
}

.ui-pagination__range,
.ui-pagination__status {
  margin: 0;
  color: var(--color-muted, #73766e);
}

.ui-pagination__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
