<template>
  <AdminPageLayout
    eyebrow="ADMINISTRAÇÃO"
    title="Gerenciamento de Usuários"
    help-text="Pesquise contas, revise seus dados e use as ações disponíveis conforme suas permissões."
  >
    <template #subtitle>
      Área restrita para usuários com permissão
      {{ cataloguePermissionLabel("users.view") }}.
    </template>

    <template #toolbar>
      <UsersListToolbar
        :search="searchTerm"
        :status="filters.status ?? ''"
        :role="filters.role ?? ''"
        :roles="filterRoleOptions"
        :selected-count="selection.selectedCount.value"
        :visible-count="visibleUserIds.length"
        @update:search="searchTerm = $event"
        @update:status="filters.status = $event || undefined"
        @update:role="filters.role = $event || undefined"
      />

      <ActionButton
        v-if="can('users.manage')"
        label="Criar usuário"
        @click="openCreate"
      />
    </template>

    <p v-if="query.isPending.value" role="status">Carregando usuários...</p>
    <p v-if="query.isFetching.value && query.data.value" role="status">
      Atualizando usuários...
    </p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col" class="selection-cell"></th>
            <th scope="col">Nome</th>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
            <th scope="col">Perfis</th>
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
            <td>
              <span
                class="user-status"
                :class="
                  user.deactivated_at === null
                    ? 'user-status--active'
                    : 'user-status--deactivated'
                "
              >
                {{ user.deactivated_at === null ? "Ativo" : "Desativado" }}
              </span>
            </td>
            <td>
              <span v-if="user.roles.length === 0" class="role-empty">
                Nenhum
              </span>
              <span v-for="role in user.roles" :key="role" class="role-pill">
                {{ roleLabel(role) }}
              </span>
            </td>
            <td class="actions-cell actions-cell--nowrap">
              <ActionButton
                type="button"
                icon="visibility"
                color="info"
                :icon-size="18"
                :label="`Ver detalhes de ${user.name}`"
                :tooltip="UI_HELP_TEXT.rowDetails"
                @click="openDetail(user.id)"
              />
              <ActionButton
                v-if="can('users.update')"
                type="button"
                icon="edit"
                color="warning"
                :icon-size="18"
                :label="`Editar ${user.name}`"
                :tooltip="UI_HELP_TEXT.rowEdit"
                @click="openEdit(user)"
              />
              <ActionButton
                v-if="can('users.set-status')"
                type="button"
                :icon="statusAction(user).icon"
                :color="user.deactivated_at === null ? 'secondary' : 'success'"
                :icon-size="18"
                :label="statusAction(user).label"
                :tooltip="UI_HELP_TEXT.rowStatus"
                :disabled="isMutating"
                :loading="isActionPending('status', user.id)"
                @click="toggleStatus(user.id, user.deactivated_at === null)"
              />
              <ActionButton
                v-if="can('users.manage')"
                type="button"
                :icon="deleteAction(user).icon"
                color="error"
                :icon-size="18"
                :label="deleteAction(user).label"
                :tooltip="UI_HELP_TEXT.rowDelete"
                :disabled="isMutating"
                :loading="isActionPending('delete', user.id)"
                @click="removeUser(user.id, user.name)"
              />
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
        :per-page-options="[5, 10, 15, 25, 50]"
        @change="filters.page = $event"
        @per-page-change="changePerPage"
      />
    </div>

    <UserDetails
      :model-value="detailUserId !== null"
      :user="detailQuery.data.value?.data ?? null"
      :is-pending="detailQuery.isPending.value"
      :is-error="detailQuery.isError.value"
      @update:model-value="closeDetail"
    />

    <UserFormModal
      :model-value="createOpen"
      @update:model-value="handleCreateVisibility"
      @created="handleCreated"
    />

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
import { Notify } from "quasar";
import Pagination from "@/shared/components/Pagination.vue";
import UsersListToolbar from "@/features/users/components/UsersListToolbar.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useDebouncedSearch } from "@/shared/composables/useDebouncedSearch";
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
import { cataloguePermissionLabel } from "@/shared/types/contract";
import { roleLabel } from "@/shared/utils/role-labels";
import { UI_HELP_TEXT } from "@/shared/utils/ui-help";

type PendingActionKind = "status" | "delete";

interface PendingAction {
  kind: PendingActionKind;
  userId: number;
}

interface RowActionPresentation {
  icon: string;
  label: string;
}

const { can } = useAuthorization();
const feedback = useFormFeedback();
const roleOptionsController = useRoleOptions(
  (filters) => listRoles(filters) as ReturnType<typeof listRoles>,
);
const filterRoleOptions = roleOptionsController.options;
const { filters, query, statusMutation, deleteMutation } = useUsersList();
const searchTerm = ref(filters.search ?? "");
useDebouncedSearch(searchTerm, (value) => {
  filters.page = 1;
  filters.search = value;
});
const createOpen = ref(false);
const editingUser = ref<AdminUser | null>(null);
const pendingAction = ref<PendingAction | null>(null);
const isMutating = computed(() => pendingAction.value !== null);
const isActionPending = (kind: PendingActionKind, userId: number): boolean =>
  pendingAction.value?.kind === kind && pendingAction.value?.userId === userId;
const statusAction = (user: AdminUser): RowActionPresentation => {
  if (isActionPending("status", user.id)) {
    return {
      icon: "progress_activity",
      label: `Atualizando status de ${user.name}`,
    };
  }
  if (user.deactivated_at === null) {
    return { icon: "toggle_off", label: `Desativar ${user.name}` };
  }
  return { icon: "toggle_on", label: `Ativar ${user.name}` };
};
const deleteAction = (user: AdminUser): RowActionPresentation => {
  if (isActionPending("delete", user.id)) {
    return { icon: "progress_activity", label: `Excluindo ${user.name}` };
  }
  return { icon: "delete", label: `Excluir ${user.name}` };
};

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
const changePerPage = (perPage: number): void => {
  selection.clear();
  filters.page = 1;
  filters.per_page = perPage;
};

const openCreate = (): void => {
  createOpen.value = true;
};
const handleCreateVisibility = (value: boolean): void => {
  if (!value) createOpen.value = false;
};
const openEdit = (user: AdminUser): void => {
  editingUser.value = user;
};
const handleEditVisibility = (value: boolean): void => {
  if (!value) editingUser.value = null;
};

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
  feedback.reportSuccess("Perfis atualizados com sucesso.");
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
    const message = isActive ? "Usuário desativado." : "Usuário ativado.";
    feedback.clearFeedback();
    Notify.create({
      message,
      timeout: 4000,
      position: "bottom-right",
      color: "dark",
      textColor: "white",
      attrs: { role: "status", "aria-live": "polite" },
    });
  } catch (error: unknown) {
    feedback.handleFailure(error);
    Notify.create({
      message:
        feedback.errorMessage.value ?? "Não foi possível atualizar o usuário.",
      timeout: 4000,
      position: "bottom-right",
      color: "dark",
      textColor: "white",
      attrs: { role: "status", "aria-live": "polite" },
    });
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
  gap: 0.5rem;
}

.actions-cell--nowrap {
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
}

.actions-cell--nowrap > * {
  flex: 0 0 auto;
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

.user-status {
  display: inline-block;
  min-width: 5.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
  transition:
    color var(--motion-quick, 180ms) ease,
    background-color var(--motion-quick, 180ms) ease;
}

.user-status--active {
  background: rgb(88 123 97 / 12%);
  color: var(--color-success);
}

.user-status--deactivated {
  background: rgb(115 118 110 / 12%);
  color: var(--color-muted);
}

@media (prefers-reduced-motion: reduce) {
  .user-status {
    transition: none;
  }
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
