<template>
  <AdminPageLayout eyebrow="SEGURANÇA & AUDITORIA" title="Logs de Auditoria">
    <template #subtitle>
      Área restrita para usuários com permissão <code>logs.view</code>.
    </template>

    <div class="filters" aria-label="Filtros de auditoria">
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
    <p v-if="query.isError.value" role="alert">
      Não foi possível carregar os registros de auditoria.
    </p>

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Evento</th>
            <th scope="col">Descrição</th>
            <th scope="col">Entidade</th>
            <th scope="col">Data</th>
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
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="4">Nenhum registro encontrado.</td>
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
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useQuery } from "@tanstack/vue-query";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import { listActivities } from "../api/audit.api";
import {
  AUDIT_EVENTS,
  AUDIT_EVENT_LABELS,
  AUDIT_SUBJECT_TYPE_LABELS,
  AUDIT_SUBJECT_TYPES,
  type ActivityFilters,
  type AuditSubjectType,
} from "../api/audit.types";

const filters = reactive<ActivityFilters>({ page: 1, per_page: 15 });
const query = useQuery({
  queryKey: computed(() => ["audit", { ...filters }]),
  queryFn: () => listActivities({ ...filters }),
});
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

.pagination {
  justify-content: flex-end;
  align-items: center;
  margin: 1rem 0 0;
}
</style>
