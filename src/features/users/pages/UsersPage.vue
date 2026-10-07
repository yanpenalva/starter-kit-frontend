<template>
  <AdminPageLayout eyebrow="ADMINISTRAÇÃO" title="Gerenciamento de Usuários">
    <template #subtitle>
      Área restrita para usuários com permissão <code>users.view</code>.
    </template>

    <div class="filters" aria-label="Filtros de usuários">
      <label>
        Buscar
        <input
          v-model="filters.search"
          aria-label="Buscar usuários"
          type="search"
        />
      </label>
      <label>
        Status
        <select v-model="filters.status" aria-label="Filtrar por status">
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="deactivated">Desativados</option>
        </select>
      </label>
      <label>
        Papel
        <select v-model="filters.role" aria-label="Filtrar por papel">
          <option value="">Todos</option>
          <option value="admin">admin</option>
          <option value="user">user</option>
        </select>
      </label>
    </div>

    <p v-if="query.isPending.value" role="status">Carregando usuários...</p>
    <p v-if="query.isError.value" role="alert">
      Não foi possível carregar os usuários.
    </p>
    <p v-if="mutationError" role="alert">{{ mutationError }}</p>

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
            <th scope="col">Papéis</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in query.data.value.data" :key="user.id">
            <td>
              <input
                v-model="editedNames[user.id]"
                :aria-label="`Nome de ${user.name}`"
              />
              <button
                type="button"
                :aria-label="`Salvar nome de ${user.name}`"
                :disabled="isMutating"
                @click="saveName(user.id)"
              >
                {{
                  isActionPending("name", user.id)
                    ? "Salvando..."
                    : "Salvar nome"
                }}
              </button>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.deactivated_at === null ? "Ativo" : "Desativado" }}</td>
            <td>
              <input
                v-model="editedRoles[user.id]"
                :aria-label="`Papéis de ${user.name}`"
              />
              <button
                type="button"
                :aria-label="`Salvar papéis de ${user.name}`"
                :disabled="isMutating"
                @click="saveRoles(user.id)"
              >
                {{
                  isActionPending("roles", user.id)
                    ? "Salvando..."
                    : "Salvar papéis"
                }}
              </button>
            </td>
            <td>
              <button
                type="button"
                :aria-label="`${user.deactivated_at === null ? 'Desativar' : 'Ativar'} ${user.name}`"
                :disabled="isMutating"
                @click="toggleStatus(user.id, user.deactivated_at === null)"
              >
                {{
                  isActionPending("status", user.id)
                    ? "Atualizando..."
                    : user.deactivated_at === null
                      ? "Desativar"
                      : "Ativar"
                }}
              </button>
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="5">Nenhum usuário encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      v-if="query.data.value"
      class="pagination"
      aria-label="Paginação de usuários"
    >
      <button
        type="button"
        aria-label="Página anterior"
        :disabled="query.data.value.meta.current_page <= 1"
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
        :disabled="
          query.data.value.meta.current_page >= query.data.value.meta.last_page
        "
        @click="filters.page = (filters.page ?? 1) + 1"
      >
        Próxima
      </button>
    </nav>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import { useUsersList } from "@/features/users/composables/useUsersList";

type PendingActionKind = "name" | "roles" | "status";

interface PendingAction {
  kind: PendingActionKind;
  userId: number;
}

const { filters, query, updateMutation, statusMutation, rolesMutation } =
  useUsersList();
const editedNames = reactive<Record<number, string>>({});
const editedRoles = reactive<Record<number, string>>({});
const mutationError = ref<string | null>(null);
const pendingAction = ref<PendingAction | null>(null);
const isMutating = computed(() => pendingAction.value !== null);
const isActionPending = (kind: PendingActionKind, userId: number): boolean =>
  pendingAction.value?.kind === kind && pendingAction.value?.userId === userId;
watch([() => filters.search, () => filters.status, () => filters.role], () => {
  filters.page = 1;
});
watch(
  query.data,
  (page) => {
    page?.data.forEach((user) => {
      editedNames[user.id] = user.name;
      editedRoles[user.id] = user.roles.join(", ");
    });
  },
  { immediate: true },
);

const saveName = async (userId: number): Promise<void> => {
  if (pendingAction.value !== null) return;
  mutationError.value = null;
  pendingAction.value = { kind: "name", userId };
  try {
    await updateMutation.mutateAsync({
      userId,
      payload: { name: editedNames[userId] },
    });
  } catch {
    mutationError.value = "Não foi possível atualizar o usuário.";
  } finally {
    pendingAction.value = null;
  }
};
const saveRoles = async (userId: number): Promise<void> => {
  if (pendingAction.value !== null) return;
  mutationError.value = null;
  pendingAction.value = { kind: "roles", userId };
  try {
    const roles = (editedRoles[userId] ?? "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    await rolesMutation.mutateAsync({ userId, payload: { roles } });
  } catch {
    mutationError.value = "Não foi possível atualizar os papéis do usuário.";
  } finally {
    pendingAction.value = null;
  }
};
const toggleStatus = async (
  userId: number,
  isActive: boolean,
): Promise<void> => {
  if (pendingAction.value !== null) return;
  mutationError.value = null;
  pendingAction.value = { kind: "status", userId };
  try {
    await statusMutation.mutateAsync({
      userId,
      payload: { status: isActive ? "deactivated" : "active" },
    });
  } catch {
    mutationError.value = "Não foi possível atualizar o status do usuário.";
  } finally {
    pendingAction.value = null;
  }
};
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

td:first-child,
td:nth-child(4) {
  display: flex;
  gap: 0.5rem;
}

.pagination {
  justify-content: flex-end;
  align-items: center;
  margin: 1rem 0 0;
}
</style>
