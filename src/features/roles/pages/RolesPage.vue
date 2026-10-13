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
    </template>

    <p v-if="query.isPending.value" role="status">Carregando papéis...</p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <form
      v-if="can('roles.manage')"
      class="search-field"
      aria-label="Criar papel"
      @submit.prevent="createNewRole"
    >
      Nome do papel
      <input v-model="newRoleName" aria-label="Nome do novo papel" required />
      <FieldErrors
        :errors="feedback.fieldErrors.value.name ?? []"
        field-label="Nome do novo papel"
      />
      <button type="submit" :disabled="creatingRole">Criar papel</button>
    </form>

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
            <th scope="row">{{ role.name }}</th>
            <td>
              <q-expansion-item
                dense
                :label="`Permissões de ${role.name}`"
                :caption="`${editedPermissions[role.id]?.length ?? 0} de ${CATALOGUE_PERMISSIONS.length} concedidas`"
                :toggle-aria-label="`Permissões de ${role.name}`"
              >
                <fieldset v-for="group in PERMISSION_GROUPS" :key="group.id">
                  <legend>{{ group.label }}</legend>
                  <label
                    v-for="permission in group.permissions"
                    :key="permission"
                  >
                    <input
                      v-model="editedPermissions[role.id]"
                      type="checkbox"
                      :value="permission"
                      :disabled="
                        isRoleImmutable(role) ||
                        !can('roles.update-permissions')
                      "
                      :aria-label="`Permissão ${CATALOGUE_PERMISSION_LABELS[permission]} para ${role.name}`"
                    />
                    {{ CATALOGUE_PERMISSION_LABELS[permission] }}
                  </label>
                </fieldset>
              </q-expansion-item>
            </td>
            <td>
              <button
                type="button"
                :aria-label="`Ver detalhes do papel ${role.name}`"
                @click="openDetail(role)"
              >
                Detalhes
              </button>
              <button
                v-if="can('roles.update-permissions')"
                type="button"
                :disabled="
                  isRoleImmutable(role) || permissionMutation.isPending.value
                "
                :aria-label="`Editar permissões de ${role.name}`"
                @click="savePermissions(role.id)"
              >
                {{
                  pendingRoleId === role.id &&
                  permissionMutation.isPending.value
                    ? "Salvando..."
                    : "Salvar permissões"
                }}
              </button>
              <button
                v-if="can('roles.manage') && !isRoleImmutable(role)"
                type="button"
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
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import Pagination from "@/shared/components/Pagination.vue";
import SearchInput from "@/shared/components/SearchInput.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { usePageSelection } from "@/shared/composables/usePageSelection";
import {
  CATALOGUE_PERMISSIONS,
  CATALOGUE_PERMISSION_LABELS,
  type CataloguePermission,
} from "@/shared/types/contract";
import { PERMISSION_GROUPS } from "@/features/roles/permission-groups";
import {
  isRoleImmutable,
  type AdminRole,
} from "@/features/roles/api/roles.types";
import { useRolesList } from "@/features/roles/composables/useRolesList";
import RoleDetails from "@/features/roles/components/RoleDetails.vue";

const { can } = useAuthorization();
const feedback = useFormFeedback();
const { filters, query, permissionMutation, createMutation, deleteMutation } =
  useRolesList();
const editedPermissions = reactive<Record<number, CataloguePermission[]>>({});
const newRoleName = ref("");
const pendingRoleId = ref<number | null>(null);
const creatingRole = ref(false);
const deletingRoleId = ref<number | null>(null);
const detailRole = ref<AdminRole | null>(null);

// A seleção cobre apenas os papéis carregados na página atual: busca, página
// e per_page limpam; refetch mantém somente os IDs presentes.
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

watch(
  () => filters.search,
  () => {
    filters.page = 1;
  },
);
watch(
  query.data,
  (page) => {
    page?.data.forEach((role) => {
      editedPermissions[role.id] = [...role.permissions];
    });
  },
  { immediate: true },
);
watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error);
  }
});

const savePermissions = async (roleId: number): Promise<void> => {
  if (permissionMutation.isPending.value) return;
  if (!can("roles.update-permissions")) return;
  pendingRoleId.value = roleId;
  try {
    await permissionMutation.mutateAsync({
      roleId,
      payload: { permissions: editedPermissions[roleId] ?? [] },
    });
    feedback.reportSuccess("Permissões atualizadas com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  } finally {
    pendingRoleId.value = null;
  }
};
const createNewRole = async (): Promise<void> => {
  if (creatingRole.value || !can("roles.manage")) return;
  creatingRole.value = true;
  try {
    await createMutation.mutateAsync({ name: newRoleName.value });
    newRoleName.value = "";
    feedback.reportSuccess("Papel criado com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  } finally {
    creatingRole.value = false;
  }
};
const removeRole = async (roleId: number, roleName: string): Promise<void> => {
  if (deletingRoleId.value !== null || !can("roles.manage")) return;
  if (!globalThis.confirm(`Excluir o papel ${roleName}?`)) return;
  deletingRoleId.value = roleId;
  try {
    await deleteMutation.mutateAsync(roleId);
    feedback.reportSuccess("Papel excluído com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
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

.selection-counter {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.875rem;
}

.search-field {
  display: grid;
  width: min(100%, 24rem);
  gap: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

input,
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

tbody tr td:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

fieldset {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.5rem;
  border: 0;
  padding: 0;
  margin: 0;
}

fieldset + fieldset {
  margin-top: 0.75rem;
}

legend {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

fieldset label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
}
</style>
