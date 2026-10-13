<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoleOptions } from "@/features/roles/composables/useRoleOptions";
import { listRoles } from "@/features/roles/api/roles.api";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    disabled?: boolean;
    ariaLabel?: string;
  }>(),
  {
    disabled: false,
    ariaLabel: "Selecionar papéis",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const term = ref("");
const { options, isLoading, hasMore, search, loadMore } =
  useRoleOptions(listRoles);
watch(term, (value) => search(value));

const selectedNames = computed(() => new Set(props.modelValue));

const toggle = (name: string): void => {
  const next = selectedNames.value.has(name)
    ? props.modelValue.filter((role) => role !== name)
    : [...props.modelValue, name];
  emit("update:modelValue", next);
};

const remove = (name: string): void => {
  emit(
    "update:modelValue",
    props.modelValue.filter((role) => role !== name),
  );
};

const onListScroll = (event: Event): void => {
  const target = event.target as HTMLElement;
  const nearBottom =
    target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
  if (nearBottom && hasMore.value && !isLoading.value) {
    void loadMore();
  }
};
</script>

<template>
  <div class="role-multi-select">
    <ul class="role-multi-select__chips" aria-label="Papéis selecionados">
      <li v-for="role in props.modelValue" :key="role" class="chip">
        {{ role }}
        <button
          type="button"
          class="chip__remove"
          :aria-label="`Remover papel ${role}`"
          :disabled="props.disabled"
          @click="remove(role)"
        >
          ×
        </button>
      </li>
      <li v-if="props.modelValue.length === 0" class="chip chip--empty">
        Nenhum papel
      </li>
    </ul>

    <input
      v-model="term"
      type="search"
      class="role-multi-select__search"
      :aria-label="`Buscar papéis para ${props.ariaLabel}`"
      placeholder="Buscar papéis..."
      :disabled="props.disabled"
    />

    <ul
      class="role-multi-select__list"
      :aria-label="props.ariaLabel"
      role="listbox"
      aria-multiselectable="true"
      @scroll="onListScroll"
    >
      <li v-if="isLoading && options.length === 0" role="status">
        Carregando papéis...
      </li>
      <li
        v-for="option in options"
        :key="option.id"
        class="role-option"
        :class="{ 'role-option--selected': selectedNames.has(option.name) }"
      >
        <label>
          <input
            type="checkbox"
            :checked="selectedNames.has(option.name)"
            :disabled="props.disabled"
            :aria-label="`Papel ${option.name}`"
            role="option"
            :aria-selected="selectedNames.has(option.name)"
            @change="toggle(option.name)"
          />
          {{ option.name }}
        </label>
      </li>
      <li v-if="!isLoading && options.length === 0">
        Nenhum papel encontrado.
      </li>
      <li v-if="hasMore && options.length > 0" class="role-option--more">
        Role para carregar mais...
      </li>
    </ul>
  </div>
</template>

<style scoped>
.role-multi-select {
  display: grid;
  gap: 0.5rem;
}

.role-multi-select__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: rgb(49 72 48 / 10%);
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 600;
}

.chip--empty {
  background: transparent;
  color: var(--color-muted, #888);
  font-style: italic;
  font-weight: 400;
}

.chip__remove {
  min-height: auto;
  padding: 0 0.25rem;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}

.role-multi-select__search {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
}

.role-multi-select__list {
  max-height: 12rem;
  overflow-y: auto;
  display: grid;
  gap: 0.25rem;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid rgb(58 77 60 / 15%);
  border-radius: 0.375rem;
  list-style: none;
  font-size: 0.875rem;
}

.role-option--selected {
  background: rgb(49 72 48 / 8%);
}

.role-option label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.role-option--more {
  color: var(--color-muted, #888);
  font-size: 0.75rem;
}
</style>
