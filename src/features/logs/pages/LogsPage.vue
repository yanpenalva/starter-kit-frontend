<template>
  <AdminPageLayout eyebrow="SEGURANÇA & AUDITORIA" title="Logs de Auditoria">
    <template #subtitle>
      Área restrita para usuários com permissão <code>logs.view</code>.
    </template>

    <template #toolbar>
      <div class="filters" aria-label="Filtros de auditoria">
        <SearchInput
          :model-value="filters.search ?? ''"
          label="Buscar na auditoria"
          :disabled="query.isPending.value"
          @update:model-value="filters.search = $event"
        />
        <label>
          Canal
          <select
            v-model="filters.log_name"
            aria-label="Filtrar por canal"
            @change="filters.page = 1"
          >
            <option value="">Todos</option>
            <option v-for="name in AUDIT_LOG_NAMES" :key="name" :value="name">
              {{ AUDIT_LOG_NAME_LABELS[name] }}
            </option>
          </select>
        </label>
        <label>
          Evento
          <select
            v-model="filters.event"
            aria-label="Filtrar por evento"
            @change="filters.page = 1"
          >
            <option value="">Todos</option>
            <option v-for="event in AUDIT_EVENTS" :key="event" :value="event">
              {{ AUDIT_EVENT_LABELS[event] }}
            </option>
          </select>
        </label>
        <label>
          Tipo de entidade
          <select
            v-model="filters.subject_type"
            aria-label="Filtrar por tipo de entidade"
            @change="filters.page = 1"
          >
            <option value="">Todos</option>
            <option
              v-for="subject in AUDIT_SUBJECT_TYPES"
              :key="subject"
              :value="subject"
            >
              {{ AUDIT_SUBJECT_TYPE_LABELS[subject] }}
            </option>
          </select>
        </label>
      </div>

      <p class="selection-counter" role="status">
        {{ selection.selectedCount.value }} de {{ visibleActivityIds.length }}
        selecionados
      </p>
    </template>

    <p v-if="query.isPending.value" role="status">
      Carregando registros de auditoria...
    </p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col" class="selection-cell">
              <input
                type="checkbox"
                class="selection-toggle"
                aria-label="Selecionar todos os registros desta página"
                :checked="selection.isAllSelected.value"
                :indeterminate.prop="selection.isIndeterminate.value"
                :disabled="!selection.isSelectable.value"
                @change="
                  selection.toggleAll(
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
            </th>
            <th scope="col">Evento</th>
            <th scope="col">Descrição</th>
            <th scope="col">Entidade</th>
            <th scope="col">Data</th>
            <th scope="col">
              <span class="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="activity in query.data.value.data" :key="activity.id">
            <td class="selection-cell">
              <input
                type="checkbox"
                class="selection-toggle"
                :aria-label="`Selecionar registro ${activity.id}`"
                :checked="selection.isSelected(activity.id)"
                :disabled="!selection.isSelectable.value"
                @change="
                  selection.setSelected(
                    activity.id,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
            </td>
            <td>{{ AUDIT_EVENT_LABELS[activity.event] }}</td>
            <td>{{ activity.description }}</td>
            <td>
              {{
                AUDIT_SUBJECT_TYPE_LABELS[
                  activity.subject_type as AuditSubjectType
                ] ?? activity.subject_type
              }}
              #{{ activity.subject_id }}
            </td>
            <td>
              {{ activity.created_at ? formatDate(activity.created_at) : "—" }}
            </td>
            <td>
              <button
                type="button"
                :aria-label="`Ver detalhes do registro ${activity.id}`"
                @click="openDetail(activity)"
              >
                Detalhes
              </button>
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="6">Nenhum registro encontrado.</td>
          </tr>
        </tbody>
      </table>

      <Pagination
        aria-label="Paginação de auditoria"
        :disabled="query.isFetching.value"
        :meta="query.data.value.meta"
        @change="filters.page = $event"
      />
    </div>

    <LogDetailModal
      :model-value="selectedActivity !== null"
      :activity="selectedActivity"
      @update:model-value="closeDetail"
    />
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import Pagination from "@/shared/components/Pagination.vue";
import SearchInput from "@/shared/components/SearchInput.vue";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { usePageSelection } from "@/shared/composables/usePageSelection";
import { listActivities } from "@/features/logs/api/audit.api";
import LogDetailModal from "@/features/logs/components/LogDetailModal.vue";
import {
  AUDIT_EVENTS,
  AUDIT_EVENT_LABELS,
  AUDIT_LOG_NAMES,
  AUDIT_LOG_NAME_LABELS,
  AUDIT_SUBJECT_TYPE_LABELS,
  AUDIT_SUBJECT_TYPES,
  type ActivityFilters,
  type AdminActivity,
  type AuditSubjectType,
} from "@/features/logs/api/audit.types";

const feedback = useFormFeedback();
const filters = reactive<ActivityFilters>({ page: 1, per_page: 15 });
const selectedActivity = ref<AdminActivity | null>(null);

const query = useQuery({
  queryKey: computed(() => ["audit", { ...filters }]),
  queryFn: () => listActivities({ ...filters }),
});

// A seleção cobre apenas os registros carregados na página atual: busca,
// filtros, página e per_page limpam; refetch mantém só os IDs presentes.
const visibleActivityIds = computed<readonly number[]>(() =>
  (query.data.value?.data ?? []).map((activity) => activity.id),
);
const selection = usePageSelection({
  visibleIds: () => visibleActivityIds.value,
  enabled: () => !query.isFetching.value && !query.isError.value,
  scopeKey: () =>
    [
      filters.page,
      filters.per_page,
      filters.search ?? "",
      filters.event ?? "",
      filters.log_name ?? "",
      filters.subject_type ?? "",
    ].join("|"),
});

watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error);
  }
});
watch(
  () => filters.search,
  () => {
    filters.page = 1;
  },
);

const openDetail = (activity: AdminActivity): void => {
  selectedActivity.value = activity;
};
const closeDetail = (): void => {
  selectedActivity.value = null;
};
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
</script>

<style scoped>
.filters {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

select,
button {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252b25);
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th,
td {
  padding: 0.75rem;
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  vertical-align: top;
}

.selection-cell {
  width: 2.5rem;
  padding-right: 0;
  text-align: center;
}

.selection-toggle {
  min-height: 0;
  padding: 0;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.selection-toggle:disabled {
  cursor: not-allowed;
}

.selection-counter {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.875rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
