<template>
  <AdminPageLayout
    eyebrow="ADMINISTRAÇÃO"
    title="Gerenciamento de Perfis"
    help-text="Consulte os perfis e suas permissões. Alterações ficam disponíveis conforme o seu acesso."
  >
    <template #subtitle>
      Área restrita para usuários com permissão
      {{ cataloguePermissionLabel("roles.view") }}.
    </template>

    <template #toolbar>
      <div class="filters" aria-label="Filtros de perfis">
        <SearchInput
          :model-value="searchTerm"
          label="Buscar"
          placeholder="Nome do perfil"
          @update:model-value="searchTerm = $event"
        />
      </div>

      <ActionButton
        v-if="can('roles.manage')"
        label="Criar perfil"
        @click="createOpen = true"
      />
    </template>

    <p v-if="query.isPending.value" role="status">Carregando perfis...</p>
    <p v-if="query.isFetching.value && query.data.value" role="status">
      Atualizando perfis...
    </p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />
    <p v-if="deleteRefusal" class="role-delete-refusal" role="alert">
      {{ deleteRefusal }}
    </p>

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Perfil</th>
            <th scope="col">Permissões</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in query.data.value.data" :key="role.id">
            <th scope="row">
              {{ roleLabel(role.name) }}
              <span
                v-if="isRoleImmutable(role)"
                class="role-immutable"
                role="note"
              >
                protegido
              </span>
            </th>
            <td>
              <span class="permission-summary">
                {{ role.permissions.length }} permissões
              </span>
            </td>
            <td class="actions-cell actions-cell--nowrap">
              <ActionButton
                type="button"
                icon="visibility"
                color="info"
                :icon-size="18"
                :label="`Ver detalhes do perfil ${role.name}`"
                :tooltip="UI_HELP_TEXT.rowDetails"
                @click="openDetail(role)"
              />
              <ActionButton
                v-if="can('roles.update-permissions')"
                type="button"
                icon="edit"
                color="warning"
                :icon-size="18"
                :disabled="isRoleImmutable(role)"
                :tooltip="
                  isRoleImmutable(role) ? UI_HELP_TEXT.immutableRole : undefined
                "
                :label="`Editar permissões do perfil ${role.name}`"
                @click="openEdit(role)"
              />
              <ActionButton
                v-if="can('roles.manage') && !isRoleImmutable(role)"
                type="button"
                :icon="deleteAction(role).icon"
                color="error"
                :icon-size="18"
                :disabled="deletingRoleId !== null"
                :loading="deleteAction(role).loading"
                :label="deleteAction(role).label"
                :tooltip="UI_HELP_TEXT.rowDelete"
                @click="requestRemoveRole(role.id, role.name)"
              />
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="3">Nenhum perfil encontrado.</td>
          </tr>
        </tbody>
      </table>

      <Pagination
        aria-label="Paginação de perfis"
        :disabled="query.isFetching.value"
        :meta="query.data.value.meta"
        :per-page-options="[5, 10, 15, 25, 50]"
        @change="filters.page = $event"
        @per-page-change="changePerPage"
      />
    </div>

    <RoleDetails
      :model-value="detailRole !== null"
      :role="detailRole"
      @update:model-value="closeDetail"
      @renamed="handleRoleRenamed"
    />

    <RoleFormModal
      :model-value="createOpen"
      mode="create"
      @update:model-value="handleCreateVisibility"
      @created="handleCreated"
    />

    <ConfirmDialog
      :model-value="confirmRole !== null"
      title="Excluir perfil"
      :message="`Deseja excluir o perfil ${confirmRole?.name ?? ''}?`"
      confirm-label="Excluir perfil"
      :busy="deletingRoleId !== null"
      @update:model-value="confirmRole = null"
      @confirm="removeRole"
    />

    <RoleFormModal
      :model-value="editRole !== null"
      mode="edit"
      :role="editRole"
      @update:model-value="handleEditVisibility"
      @permissions-saved="handlePermissionsSaved"
    />
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import ActionButton from "@/shared/components/ActionButton.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import Pagination from "@/shared/components/Pagination.vue";
import SearchInput from "@/shared/components/SearchInput.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useDebouncedSearch } from "@/shared/composables/useDebouncedSearch";
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue";
import { cataloguePermissionLabel } from "@/shared/types/contract";
import {
  isRoleImmutable,
  type AdminRole,
} from "@/features/roles/api/roles.types";
import { useRolesList } from "@/features/roles/composables/useRolesList";
import { isValidationHttpError } from "@/lib/http";
import { roleLabel } from "@/shared/utils/role-labels";
import { UI_HELP_TEXT } from "@/shared/utils/ui-help";
import RoleDetails from "@/features/roles/components/RoleDetails.vue";
import RoleFormModal from "@/features/roles/components/RoleFormModal.vue";

const { can } = useAuthorization();
const feedback = useFormFeedback();
const { filters, query, deleteMutation } = useRolesList();
const searchTerm = ref(filters.search ?? "");
useDebouncedSearch(searchTerm, (value) => {
  filters.page = 1;
  filters.search = value;
});
const createOpen = ref(false);
const editRole = ref<AdminRole | null>(null);
const deletingRoleId = ref<number | null>(null);
const detailRole = ref<AdminRole | null>(null);
const deleteRefusal = ref<string | null>(null);
const confirmRole = ref<{ id: number; name: string } | null>(null);

const openDetail = (role: AdminRole): void => {
  detailRole.value = role;
};
const closeDetail = (): void => {
  detailRole.value = null;
};
const handleRoleRenamed = (role: AdminRole): void => {
  detailRole.value = role;
  feedback.reportSuccess("Perfil renomeado com sucesso.");
};
const changePerPage = (perPage: number): void => {
  filters.page = 1;
  filters.per_page = perPage;
};
const deleteAction = (
  role: AdminRole,
): { icon: string; label: string; loading: boolean } => {
  if (deletingRoleId.value === role.id) {
    return {
      icon: "progress_activity",
      label: `Excluindo perfil ${role.name}`,
      loading: true,
    };
  }
  return {
    icon: "delete",
    label: `Excluir perfil ${role.name}`,
    loading: false,
  };
};
const openEdit = (role: AdminRole): void => {
  if (isRoleImmutable(role)) return;
  editRole.value = role;
};
const handleEditVisibility = (value: boolean): void => {
  if (!value) editRole.value = null;
};

const handleCreated = (): void => {
  createOpen.value = false;
  feedback.reportSuccess("Perfil criado com sucesso.");
};
const handleCreateVisibility = (value: boolean): void => {
  if (!value) createOpen.value = false;
};
const handlePermissionsSaved = (): void => {
  editRole.value = null;
  feedback.reportSuccess("Permissões atualizadas com sucesso.");
};

watch(
  () => filters.search,
  () => {
    filters.page = 1;
  },
);
watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error);
  }
});

const requestRemoveRole = (roleId: number, roleName: string): void => {
  if (deletingRoleId.value !== null || !can("roles.manage")) return;
  confirmRole.value = { id: roleId, name: roleName };
};
const removeRole = async (): Promise<void> => {
  const role = confirmRole.value;
  if (role === null || deletingRoleId.value !== null || !can("roles.manage"))
    return;
  confirmRole.value = null;
  feedback.clearFeedback();
  deleteRefusal.value = null;
  deletingRoleId.value = role.id;
  try {
    await deleteMutation.mutateAsync(role.id);
    feedback.reportSuccess("Perfil excluído com sucesso.");
  } catch (error: unknown) {
    if (isValidationHttpError(error)) {
      deleteRefusal.value = `O perfil ${role.name} está atribuído a usuários e não pode ser excluído.`;
    }
    if (!isValidationHttpError(error)) feedback.handleFailure(error);
  } finally {
    deletingRoleId.value = null;
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

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.actions-cell--nowrap {
  flex-wrap: nowrap;
  align-items: center;
}

.actions-cell--nowrap > * {
  flex: 0 0 auto;
}

.role-immutable {
  margin-left: 0.375rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: rgb(58 77 60 / 10%);
  color: var(--color-muted, #73766e);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-delete-refusal {
  margin: 0.75rem 0 0;
  color: #b42318;
}

.permission-summary {
  color: var(--color-muted, #73766e);
  font-size: 0.8125rem;
}
</style>
