<template>
  <AdminPageLayout eyebrow="ADMINISTRAÇÃO" title="Gerenciamento de Papéis">
    <template #subtitle>
      Área restrita para usuários com permissão <code>roles.view</code>.
    </template>

    <label class="search-field">
      Buscar
      <input
        v-model="filters.search"
        aria-label="Buscar papéis"
        type="search"
        @input="filters.page = 1"
      />
    </label>

    <p v-if="query.isPending.value" role="status">Carregando papéis...</p>
    <p v-if="query.isError.value" role="alert">
      Não foi possível carregar os papéis.
    </p>
    <p v-if="mutationError" role="alert">{{ mutationError }}</p>

    <div v-if="query.data.value" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Papel</th>
            <th scope="col">Permissões</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in query.data.value.data" :key="role.id">
            <th scope="row">{{ role.name }}</th>
            <td>
              <fieldset>
                <legend>Permissões de {{ role.name }}</legend>
                <label
                  v-for="permission in CATALOGUE_PERMISSIONS"
                  :key="permission"
                >
                  <input
                    v-model="editedPermissions[role.id]"
                    type="checkbox"
                    :value="permission"
                    :disabled="isRoleImmutable(role)"
                    :aria-label="`Permissão ${CATALOGUE_PERMISSION_LABELS[permission]} para ${role.name}`"
                  />
                  {{ CATALOGUE_PERMISSION_LABELS[permission] }}
                </label>
              </fieldset>
            </td>
            <td>
              <button
                type="button"
                :disabled="
                  isRoleImmutable(role) || permissionMutation.isPending.value
                "
                :aria-label="`Editar permissões de ${role.name}`"
                @click="savePermissions(role.id)"
              >
                Salvar permissões
              </button>
            </td>
          </tr>
          <tr v-if="query.data.value.data.length === 0">
            <td colspan="3">Nenhum papel encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      v-if="query.data.value"
      class="pagination"
      aria-label="Paginação de papéis"
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
import { reactive, ref, watch } from "vue";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import {
  CATALOGUE_PERMISSIONS,
  CATALOGUE_PERMISSION_LABELS,
  type CataloguePermission,
} from "@/shared/types/contract";
import { isRoleImmutable } from "@/features/roles/api/roles.types";
import { useRolesList } from "@/features/roles/composables/useRolesList";

const { filters, query, permissionMutation } = useRolesList();
const editedPermissions = reactive<Record<number, CataloguePermission[]>>({});
const mutationError = ref<string | null>(null);
watch(
  query.data,
  (page) => {
    page?.data.forEach((role) => {
      editedPermissions[role.id] = [...role.permissions];
    });
  },
  { immediate: true },
);

const savePermissions = async (roleId: number): Promise<void> => {
  mutationError.value = null;
  try {
    await permissionMutation.mutateAsync({
      roleId,
      payload: { permissions: editedPermissions[roleId] ?? [] },
    });
  } catch {
    mutationError.value = "Não foi possível atualizar as permissões do papel.";
  }
};
</script>

<style scoped>
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

fieldset {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.5rem;
  border: 0;
  padding: 0;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
