<template>
  <AdminPageLayout eyebrow="ADMINISTRAÇÃO" title="Gerenciamento de Usuários">
    <template #subtitle>
      Área restrita para usuários com permissão <code>users.view</code>.
    </template>

    <template #toolbar>
      <div class="filters" aria-label="Filtros de usuários">
        <SearchInput
          :model-value="filters.search ?? ''"
          label="Buscar"
          placeholder="Nome ou email"
          :disabled="query.isFetching.value"
          @update:model-value="filters.search = $event"
        />
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
            <option
              v-for="role in filterRoleOptions"
              :key="role.id"
              :value="role.name"
            >
              {{ role.name }}
            </option>
          </select>
        </label>
      </div>

      <p class="selection-counter" role="status">
        {{ selection.selectedCount.value }} de {{ visibleUserIds.length }}
        selecionados
      </p>

      <ActionButton
        v-if="can('users.manage')"
        label="Criar usuário"
        @click="openCreate"
      />
    </template>

    <p v-if="query.isPending.value" role="status">Carregando usuários...</p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col" class="selection-cell">
              <input
                type="checkbox"
                class="selection-toggle"
                aria-label="Selecionar todos os usuários desta página"
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
            <th scope="col">Nome</th>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
            <th scope="col">Papéis</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in query.data.value.data" :key="user.id">
            <td class="selection-cell">
              <input
                type="checkbox"
                class="selection-toggle"
                :aria-label="`Selecionar ${user.name}`"
                :checked="selection.isSelected(user.id)"
                :disabled="!selection.isSelectable.value"
                @change="
                  selection.setSelected(
                    user.id,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
            </td>
            <td>
              <RouterLink
                :to="{ name: 'user-detail', params: { userId: user.id } }"
                class="user-link"
                :aria-label="`Ver detalhe de ${user.name}`"
              >
                {{ user.name }}
              </RouterLink>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.deactivated_at === null ? "Ativo" : "Desativado" }}</td>
            <td>
              <span v-if="user.roles.length === 0" class="role-empty">
                Nenhum
              </span>
              <span v-for="role in user.roles" :key="role" class="role-pill">
                {{ role }}
              </span>
            </td>
            <td class="actions-cell">
              <button
                type="button"
                class="ui-control"
                :aria-label="`Ver detalhes de ${user.name}`"
                @click="openDetail(user.id)"
              >
                Detalhes
              </button>
              <button
                v-if="can('users.update')"
                type="button"
                class="ui-control"
                :aria-label="`Editar ${user.name}`"
                @click="openEdit(user)"
              >
                Editar
              </button>
              <button
                v-if="can('users.set-status')"
                type="button"
                class="ui-control"
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
              <button
                v-if="can('users.manage')"
                type="button"
                class="ui-control"
                :aria-label="`Excluir ${user.name}`"
                :disabled="isMutating"
                @click="removeUser(user.id, user.name)"
              >
                {{
                  isActionPending("delete", user.id)
                    ? "Excluindo..."
                    : "Excluir"
                }}
              </button>
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="6">Nenhum usuário encontrado.</td>
          </tr>
        </tbody>
      </table>

      <Pagination
        aria-label="Paginação de usuários"
        :disabled="query.isFetching.value"
        :meta="query.data.value.meta"
        @change="filters.page = $event"
      />
    </div>

    <UserDetails
      :model-value="detailUserId !== null"
      :user="detailQuery.data.value?.data ?? null"
      :is-pending="detailQuery.isPending.value"
      :is-error="detailQuery.isError.value"
      @update:model-value="closeDetail"
    />

    <UserFormModal :model-value="createOpen" @created="handleCreated" />

    <UserEditForm
      :model-value="editingUser !== null"
      :user="editingUser"
      @update:model-value="handleEditVisibility"
      @profile-saved="handleProfileSaved"
      @roles-saved="handleRolesSaved"
    />
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import ActionButton from "@/shared/components/ActionButton.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import Pagination from "@/shared/components/Pagination.vue";
import SearchInput from "@/shared/components/SearchInput.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { usePageSelection } from "@/shared/composables/usePageSelection";
import { useRoleOptions } from "@/features/roles/composables/useRoleOptions";
import { listRoles } from "@/features/roles/api/roles.api";
import {
  useUserDetail,
  useUsersList,
} from "@/features/users/composables/useUsersList";
import UserDetails from "@/features/users/components/UserDetails.vue";
import UserEditForm from "@/features/users/components/UserEditForm.vue";
import UserFormModal from "@/features/users/components/UserFormModal.vue";
import type { AdminUser } from "@/features/users/api/users.types";

type PendingActionKind = "status" | "delete";

interface PendingAction {
  kind: PendingActionKind;
  userId: number;
}

const { can } = useAuthorization();
const feedback = useFormFeedback();
const roleOptionsController = useRoleOptions(
  (filters) => listRoles(filters) as ReturnType<typeof listRoles>,
);
const filterRoleOptions = roleOptionsController.options;
const { filters, query, statusMutation, deleteMutation } = useUsersList();
const createOpen = ref(false);
const editingUser = ref<AdminUser | null>(null);
const pendingAction = ref<PendingAction | null>(null);
const isMutating = computed(() => pendingAction.value !== null);
const isActionPending = (kind: PendingActionKind, userId: number): boolean =>
  pendingAction.value?.kind === kind && pendingAction.value?.userId === userId;

// A seleção cobre apenas os registros carregados na página atual: busca,
// filtros, página e per_page limpam; refetch mantém só os IDs presentes.
const visibleUserIds = computed<readonly number[]>(() =>
  (query.data.value?.data ?? []).map((user) => user.id),
);
const selection = usePageSelection({
  visibleIds: () => visibleUserIds.value,
  enabled: () => !query.isFetching.value && !query.isError.value,
  scopeKey: () =>
    [
      filters.page,
      filters.per_page,
      filters.search ?? "",
      filters.status ?? "",
      filters.role ?? "",
    ].join("|"),
});

const detailUserId = ref<number | null>(null);
const detailQuery = useUserDetail(() => detailUserId.value);
const openDetail = (userId: number): void => {
  detailUserId.value = userId;
};
const closeDetail = (): void => {
  detailUserId.value = null;
};

const openCreate = (): void => {
  createOpen.value = true;
};
const openEdit = (user: AdminUser): void => {
  editingUser.value = user;
};
const handleEditVisibility = (value: boolean): void => {
  if (!value) editingUser.value = null;
};

// O modal tem feedback isolado: o sucesso do modal entra no feedback da lista,
// que também segue dono dos erros de status/exclusão.
const handleCreated = (): void => {
  createOpen.value = false;
  feedback.reportSuccess("Usuário criado com sucesso.");
};
const handleProfileSaved = (): void => {
  editingUser.value = null;
  feedback.reportSuccess("Usuário atualizado com sucesso.");
};
const handleRolesSaved = (): void => {
  editingUser.value = null;
  feedback.reportSuccess("Papéis atualizados com sucesso.");
};

watch([() => filters.search, () => filters.status, () => filters.role], () => {
  filters.page = 1;
});
watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error);
  }
});

const toggleStatus = async (
  userId: number,
  isActive: boolean,
): Promise<void> => {
  if (pendingAction.value !== null || !can("users.set-status")) return;
  pendingAction.value = { kind: "status", userId };
  try {
    await statusMutation.mutateAsync({
      userId,
      payload: { status: isActive ? "deactivated" : "active" },
    });
    feedback.reportSuccess(
      isActive
        ? "Usuário desativado com sucesso."
        : "Usuário ativado com sucesso.",
    );
  } catch (error: unknown) {
    feedback.handleFailure(error);
  } finally {
    pendingAction.value = null;
  }
};
const removeUser = async (userId: number, userName: string): Promise<void> => {
  if (pendingAction.value !== null || !can("users.manage")) return;
  if (!globalThis.confirm(`Excluir o usuário ${userName}?`)) return;
  pendingAction.value = { kind: "delete", userId };
  try {
    await deleteMutation.mutateAsync(userId);
    feedback.reportSuccess("Usuário excluído com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  } finally {
    pendingAction.value = null;
  }
};
</script>

<style scoped>
.filters {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
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

select {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252a25);
}

.table-wrap {
  overflow-x: auto;
  margin-top: 1rem;
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

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-pill,
.role-empty {
  display: inline-block;
  margin-right: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: rgb(58 77 60 / 10%);
  color: var(--color-evergreen, #456b56);
  font-size: 0.75rem;
  font-weight: 600;
}

.role-empty {
  background: transparent;
  color: var(--color-muted, #73766e);
  font-weight: 400;
  font-style: italic;
}

.user-link {
  align-self: center;
  color: var(--color-evergreen, #456b56);
  font-weight: 600;
  text-decoration: none;
}

.user-link:hover {
  text-decoration: underline;
}
</style>
