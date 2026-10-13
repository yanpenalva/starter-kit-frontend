<template>
  <AdminPageLayout eyebrow="ADMINISTRAÇÃO" title="Gerenciamento de Papéis">
    <template #subtitle>
      Área restrita para usuários com permissão <code>roles.view</code>.
    </template>

    <template #toolbar>
      <div class="filters" aria-label="Filtros de papéis">
        <SearchInput
          :model-value="filters.search ?? ''"
          label="Buscar"
          placeholder="Nome ou permissão"
          :disabled="query.isFetching.value"
          @update:model-value="filters.search = $event"
        />
      </div>

      <p class="selection-counter" role="status">
        {{ selection.selectedCount.value }} de {{ visibleRoleIds.length }}
        selecionados
      </p>

      <ActionButton
        v-if="can('roles.manage')"
        label="Criar papel"
        @click="createOpen = true"
      />
    </template>

    <p v-if="query.isPending.value" role="status">Carregando papéis...</p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col" class="selection-cell">
              <input
                type="checkbox"
                class="selection-toggle"
                aria-label="Selecionar todos os papéis desta página"
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
            <th scope="col">Papel</th>
            <th scope="col">Permissões</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in query.data.value.data" :key="role.id">
            <td class="selection-cell">
              <input
                type="checkbox"
                class="selection-toggle"
                :aria-label="`Selecionar ${role.name}`"
                :checked="selection.isSelected(role.id)"
                :disabled="!selection.isSelectable.value"
                @change="
                  selection.setSelected(
                    role.id,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
            </td>
            <th scope="row">
              {{ role.name }}
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
                {{ role.permissions.length }} de
                {{ CATALOGUE_PERMISSIONS.length }} concedidas
              </span>
            </td>
            <td class="actions-cell">
              <button
                type="button"
                class="ui-control"
                :aria-label="`Ver detalhes do papel ${role.name}`"
                @click="openDetail(role)"
              >
                Detalhes
              </button>
              <button
                v-if="can('roles.update-permissions')"
                type="button"
                class="ui-control"
                :disabled="isRoleImmutable(role)"
                :aria-label="`Editar permissões de ${role.name}`"
                @click="openEdit(role)"
              >
                Editar permissões
              </button>
              <button
                v-if="can('roles.manage') && !isRoleImmutable(role)"
                type="button"
                class="ui-control"
                :disabled="deletingRoleId !== null"
                :aria-label="`Excluir papel ${role.name}`"
                @click="removeRole(role.id, role.name)"
              >
                {{
                  deletingRoleId === role.id ? "Excluindo..." : "Excluir papel"
                }}
              </button>
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="4">Nenhum papel encontrado.</td>
          </tr>
        </tbody>
      </table>

      <Pagination
        aria-label="Paginação de papéis"
        :disabled="query.isFetching.value"
        :meta="query.data.value.meta"
        @change="filters.page = $event"
      />
    </div>

    <RoleDetails
      :model-value="detailRole !== null"
      :role="detailRole"
      @update:model-value="closeDetail"
    />

    <RoleFormModal
      :model-value="createOpen"
      mode="create"
      @created="handleCreated"
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
import { computed, ref, watch } from "vue";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import ActionButton from "@/shared/components/ActionButton.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import Pagination from "@/shared/components/Pagination.vue";
import SearchInput from "@/shared/components/SearchInput.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { usePageSelection } from "@/shared/composables/usePageSelection";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import {
  isRoleImmutable,
  type AdminRole,
} from "@/features/roles/api/roles.types";
import { useRolesList } from "@/features/roles/composables/useRolesList";
import RoleDetails from "@/features/roles/components/RoleDetails.vue";
import RoleFormModal from "@/features/roles/components/RoleFormModal.vue";

const { can } = useAuthorization();
const feedback = useFormFeedback();
const { filters, query, deleteMutation } = useRolesList();
const createOpen = ref(false);
const editRole = ref<AdminRole | null>(null);
const deletingRoleId = ref<number | null>(null);
const detailRole = ref<AdminRole | null>(null);

const visibleRoleIds = computed<readonly number[]>(() =>
  (query.data.value?.data ?? []).map((role) => role.id),
);
const selection = usePageSelection({
  visibleIds: () => visibleRoleIds.value,
  enabled: () => !query.isFetching.value && !query.isError.value,
  scopeKey: () =>
    [filters.page, filters.per_page, filters.search ?? ""].join("|"),
});

const openDetail = (role: AdminRole): void => {
  detailRole.value = role;
};
const closeDetail = (): void => {
  detailRole.value = null;
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
  feedback.reportSuccess("Papel criado com sucesso.");
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

const removeRole = async (roleId: number, roleName: string): Promise<void> => {
  if (deletingRoleId.value !== null || !can("roles.manage")) return;
  if (globalThis.confirm(`Excluir o papel ${roleName}?`)) {
    deletingRoleId.value = roleId;
    try {
      await deleteMutation.mutateAsync(roleId);
      feedback.reportSuccess("Papel excluído com sucesso.");
    } catch (error: unknown) {
      feedback.handleFailure(error);
    } finally {
      deletingRoleId.value = null;
    }
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

.permission-summary {
  color: var(--color-muted, #73766e);
  font-size: 0.8125rem;
}
</style>
