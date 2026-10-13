<script setup lang="ts">
import SearchInput from "@/shared/components/SearchInput.vue";
import type { RoleOption } from "@/features/roles/composables/useRoleOptions";
import type { UserStatus } from "@/shared/types/contract";

defineProps<{
  search: string;
  status: UserStatus | "";
  role: string;
  roles: readonly RoleOption[];
  disabled: boolean;
  selectedCount: number;
  visibleCount: number;
}>();

const emit = defineEmits<{
  "update:search": [value: string];
  "update:status": [value: UserStatus | ""];
  "update:role": [value: string];
}>();
</script>

<template>
  <div class="filters" aria-label="Filtros de usuários">
    <SearchInput
      :model-value="search"
      label="Buscar"
      placeholder="Nome ou email"
      :disabled="disabled"
      @update:model-value="emit('update:search', $event)"
    />
    <label>
      Status
      <select
        :value="status"
        aria-label="Filtrar por status"
        @change="
          emit(
            'update:status',
            ($event.target as HTMLSelectElement).value as UserStatus | '',
          )
        "
      >
        <option value="">Todos</option>
        <option value="active">Ativos</option>
        <option value="deactivated">Desativados</option>
      </select>
    </label>
    <label>
      Papel
      <select
        :value="role"
        aria-label="Filtrar por papel"
        @change="
          emit('update:role', ($event.target as HTMLSelectElement).value)
        "
      >
        <option value="">Todos</option>
        <option v-for="option in roles" :key="option.id" :value="option.name">
          {{ option.name }}
        </option>
      </select>
    </label>
  </div>

  <p class="selection-counter" role="status">
    {{ selectedCount }} de {{ visibleCount }} selecionados
  </p>
</template>

<style scoped>
.filters {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0;
}

.selection-counter {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.875rem;
}

label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input,
select {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252b25);
}
</style>
