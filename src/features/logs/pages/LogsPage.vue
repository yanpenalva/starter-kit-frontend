<template>
  <AdminPageLayout eyebrow="SEGURANÇA & AUDITORIA" title="Logs de Auditoria">
    <template #subtitle>
      Área restrita para usuários com permissão <code>logs.view</code>.
    </template>

    <div class="filters" aria-label="Filtros de auditoria">
      <label>
        Buscar
        <input
          v-model="filters.search"
          aria-label="Buscar na auditoria"
          type="search"
        />
      </label>
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

    <p v-if="query.isPending.value" role="status">
      Carregando registros de auditoria...
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
                @click="selectedActivity = activity"
              >
                Detalhes
              </button>
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="5">Nenhum registro encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      v-if="query.data.value"
      class="pagination"
      aria-label="Paginação de auditoria"
    >
      <button
        type="button"
        aria-label="Página anterior"
        :disabled="(filters.page ?? 1) <= 1"
        @click="filters.page = Math.max(1, (filters.page ?? 1) - 1)"
      >
        Anterior
      </button>
      <span
        >Página {{ query.data.value.meta.current_page }} de
        {{ query.data.value.meta.last_page }}</span
      >
      <button
        type="button"
        aria-label="Próxima página"
        :disabled="(filters.page ?? 1) >= query.data.value.meta.last_page"
        @click="filters.page = (filters.page ?? 1) + 1"
      >
        Próxima
      </button>
    </nav>

    <div
      v-if="selectedActivity"
      class="drawer-backdrop"
      @click.self="closeDrawer"
    >
      <section
        class="drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="`Detalhes do registro ${selectedActivity.id}`"
      >
        <header class="drawer-header">
          <h2>Detalhes do registro #{{ selectedActivity.id }}</h2>
          <button
            type="button"
            :aria-label="`Fechar detalhes do registro ${selectedActivity.id}`"
            @click="closeDrawer"
          >
            Fechar
          </button>
        </header>
        <dl class="drawer-meta">
          <div>
            <dt>Evento</dt>
            <dd>{{ AUDIT_EVENT_LABELS[selectedActivity.event] }}</dd>
          </div>
          <div>
            <dt>Canal</dt>
            <dd>
              {{
                AUDIT_LOG_NAME_LABELS[
                  selectedActivity.log_name as AuditLogName
                ] ?? selectedActivity.log_name
              }}
            </dd>
          </div>
          <div>
            <dt>Entidade</dt>
            <dd>
              {{
                AUDIT_SUBJECT_TYPE_LABELS[
                  selectedActivity.subject_type as AuditSubjectType
                ] ?? selectedActivity.subject_type
              }}
              #{{ selectedActivity.subject_id }}
            </dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>
              {{
                selectedActivity.created_at
                  ? formatDate(selectedActivity.created_at)
                  : "—"
              }}
            </dd>
          </div>
        </dl>
        <p class="drawer-description">{{ selectedActivity.description }}</p>
        <h3>Payload da auditoria</h3>
        <pre data-testid="activity-payload">{{
          formatPayload(selectedActivity.properties)
        }}</pre>
      </section>
    </div>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { listActivities } from "@/features/logs/api/audit.api";
import {
  AUDIT_EVENTS,
  AUDIT_EVENT_LABELS,
  AUDIT_LOG_NAMES,
  AUDIT_LOG_NAME_LABELS,
  AUDIT_SUBJECT_TYPE_LABELS,
  AUDIT_SUBJECT_TYPES,
  type ActivityFilters,
  type AdminActivity,
  type AuditLogName,
  type AuditSubjectType,
} from "@/features/logs/api/audit.types";

const feedback = useFormFeedback();
const filters = reactive<ActivityFilters>({ page: 1, per_page: 15 });
const selectedActivity = ref<AdminActivity | null>(null);
const query = useQuery({
  queryKey: computed(() => ["audit", { ...filters }]),
  queryFn: () => listActivities({ ...filters }),
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
const closeDrawer = (): void => {
  selectedActivity.value = null;
};
const formatPayload = (properties: Record<string, unknown>): string =>
  JSON.stringify(properties, null, 2);
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
</script>

<style scoped>
.filters,
.pagination {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input,
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

.pagination {
  justify-content: flex-end;
  align-items: center;
  margin: 1rem 0 0;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  background: rgb(0 0 0 / 35%);
}

.drawer {
  display: flex;
  width: min(100%, 28rem);
  height: 100%;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1.5rem;
  background: white;
  box-shadow: -12px 0 30px rgb(0 0 0 / 15%);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.drawer-header h2 {
  margin: 0;
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.drawer-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.drawer-meta dt {
  color: var(--color-muted, #666);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.drawer-meta dd {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-ink, #252b25);
}

.drawer-description {
  margin: 0;
  color: var(--color-ink, #252b25);
  font-size: 0.9375rem;
}

.drawer h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted, #666);
}

.drawer pre {
  margin: 0;
  padding: 0.75rem;
  overflow-x: auto;
  border: 1px solid rgb(58 77 60 / 15%);
  border-radius: 0.375rem;
  background: rgb(58 77 60 / 5%);
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
