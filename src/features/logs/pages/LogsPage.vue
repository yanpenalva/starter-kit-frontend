<template>
  <AdminPageLayout
    eyebrow="SEGURANÇA & AUDITORIA"
    title="Logs de Auditoria"
    help-text="Filtre os registros e abra um item para consultar seus metadados e payload."
  >
    <template #subtitle>
      Área restrita para usuários com permissão
      {{ cataloguePermissionLabel("logs.view") }}.
    </template>

    <template #toolbar>
      <div v-if="canViewLogs" class="filters" aria-label="Filtros de auditoria">
        <SearchInput
          :model-value="searchTerm"
          label="Buscar por ator, evento ou ação"
          @update:model-value="searchTerm = $event"
        />
        <label>
          Ação
          <select
            v-model="filters.action"
            aria-label="Filtrar por ação"
            @change="filters.page = 1"
          >
            <option value="">Todas</option>
            <option
              v-for="action in AUDIT_ACTIONS"
              :key="action"
              :value="action"
            >
              {{ AUDIT_ACTION_LABELS[action] }}
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
    </template>

    <p v-if="!canViewLogs" role="alert" data-testid="logs-restricted">
      A permissão logs.view é necessária para consultar os registros de
      auditoria.
    </p>

    <template v-if="canViewLogs">
      <p v-if="query.isPending.value" role="status">
        Carregando registros de auditoria...
      </p>
      <p v-if="query.isFetching.value && query.data.value" role="status">
        Atualizando registros de auditoria...
      </p>
      <FormFeedback :feedback="feedback" @retry="feedback.retry" />

      <div v-if="query.data.value" class="table-wrap">
        <table>
          <thead>
            <tr>
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
              <td>
                {{
                  AUDIT_EVENT_LABELS[activity.event as AuditEvent] ??
                  activity.event
                }}
              </td>
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
                {{
                  activity.created_at ? formatDate(activity.created_at) : "—"
                }}
              </td>
              <td>
                <ActionButton
                  type="button"
                  icon="visibility"
                  color="info"
                  :icon-size="18"
                  :label="`Ver detalhes do registro ${activity.id}`"
                  :tooltip="UI_HELP_TEXT.rowDetails"
                  @click="openDetail(activity)"
                />
              </td>
            </tr>
            <tr v-if="query.data.value.data.length === 0">
              <td colspan="5">Nenhum registro encontrado.</td>
            </tr>
          </tbody>
        </table>

        <Pagination
          aria-label="Paginação de auditoria"
          :disabled="query.isFetching.value"
          :meta="query.data.value.meta"
          :per-page-options="[5, 10, 15, 25, 50]"
          @change="filters.page = $event"
          @per-page-change="changePerPage"
        />
      </div>

      <LogDetailModal
        :model-value="selectedActivity !== null"
        :activity="selectedActivity"
        @update:model-value="closeDetail"
      />
    </template>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import ActionButton from "@/shared/components/ActionButton.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import Pagination from "@/shared/components/Pagination.vue";
import SearchInput from "@/shared/components/SearchInput.vue";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useDebouncedSearch } from "@/shared/composables/useDebouncedSearch";
import { listActivities } from "@/features/logs/api/audit.api";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import LogDetailModal from "@/features/logs/components/LogDetailModal.vue";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  AUDIT_EVENTS,
  AUDIT_EVENT_LABELS,
  AUDIT_SUBJECT_TYPE_LABELS,
  AUDIT_SUBJECT_TYPES,
  type AuditEvent,
  type ActivityFilters,
  type AdminActivity,
  type AuditSubjectType,
} from "@/features/logs/api/audit.types";
import { cataloguePermissionLabel } from "@/shared/types/contract";
import { UI_HELP_TEXT } from "@/shared/utils/ui-help";

const feedback = useFormFeedback();
const { can } = useAuthorization();
const canViewLogs = computed(() => can("logs.view"));
const filters = reactive<ActivityFilters>({ page: 1, per_page: 10 });
const searchTerm = ref(filters.search ?? "");
const selectedActivity = ref<AdminActivity | null>(null);
useDebouncedSearch(searchTerm, (value) => {
  filters.page = 1;
  filters.search = value;
});

const query = useQuery({
  queryKey: computed(() => ["audit", { ...filters }]),
  queryFn: () => listActivities({ ...filters }),
  placeholderData: keepPreviousData,
  enabled: canViewLogs,
});

watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error);
  }
});
const openDetail = (activity: AdminActivity): void => {
  selectedActivity.value = activity;
};
const closeDetail = (): void => {
  selectedActivity.value = null;
};
const changePerPage = (perPage: number): void => {
  filters.page = 1;
  filters.per_page = perPage;
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

thead th {
  color: var(--color-muted, #73766e);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

tbody tr:hover {
  background: rgb(58 77 60 / 3%);
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
