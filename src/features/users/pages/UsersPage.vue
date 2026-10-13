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
    </template>

    <p v-if="query.isPending.value" role="status">Carregando usuários...</p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <form
      v-if="can('users.manage')"
      class="create-form"
      aria-label="Criar usuário"
      @submit.prevent="createNewUser"
    >
      <label>
        Nome
        <input
          v-model="newUser.name"
          aria-label="Nome do novo usuário"
          required
        />
      </label>
      <label>
        Email
        <input
          v-model="newUser.email"
          aria-label="Email do novo usuário"
          type="email"
          required
        />
        <FieldErrors
          :errors="feedback.fieldErrors.value.email ?? []"
          field-label="Email do novo usuário"
        />
      </label>
      <label>
        CPF
        <input
          v-model="newUser.cpf"
          aria-label="CPF do novo usuário"
          inputmode="numeric"
          required
        />
        <FieldErrors
          :errors="feedback.fieldErrors.value.cpf ?? []"
          field-label="CPF do novo usuário"
        />
      </label>
      <label>
        Senha (mínimo 12 caracteres)
        <input
          v-model="newUser.password"
          aria-label="Senha do novo usuário"
          type="password"
          minlength="12"
          required
        />
      </label>
      <label>
        <input
          v-model="newUser.active"
          aria-label="Ativar novo usuário imediatamente"
          type="checkbox"
        />
        Ativo
      </label>
      <button type="submit" :disabled="isMutating">Criar usuário</button>
    </form>

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
              <input
                v-model="editedNames[user.id]"
                :aria-label="`Nome de ${user.name}`"
              />
              <button
                v-if="can('users.update')"
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
              <RoleMultiSelect
                v-if="can('users.assign-roles')"
                :model-value="editedRoles[user.id] ?? []"
                :aria-label="`Papéis de ${user.name}`"
                :disabled="isMutating"
                @update:model-value="editedRoles[user.id] = $event"
              />
              <span v-else>{{ user.roles.join(", ") }}</span>
              <button
                v-if="can('users.assign-roles')"
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
                :aria-label="`Ver detalhes de ${user.name}`"
                @click="openDetail(user.id)"
              >
                Detalhes
              </button>
              <button
                v-if="can('users.set-status')"
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
              <button
                v-if="can('users.manage')"
                type="button"
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
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import Pagination from "@/shared/components/Pagination.vue";
import RoleMultiSelect from "@/shared/components/RoleMultiSelect.vue";
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

type PendingActionKind = "name" | "roles" | "status" | "create" | "delete";

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
const {
  filters,
  query,
  updateMutation,
  statusMutation,
  rolesMutation,
  createMutation,
  deleteMutation,
} = useUsersList();
const editedNames = reactive<Record<number, string>>({});
const editedRoles = reactive<Record<number, string[]>>({});
const newUser = reactive({
  name: "",
  email: "",
  cpf: "",
  password: "",
  active: false,
});
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

watch([() => filters.search, () => filters.status, () => filters.role], () => {
  filters.page = 1;
});
watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error);
  }
});
watch(
  query.data,
  (page) => {
    page?.data.forEach((user) => {
      editedNames[user.id] = user.name;
      editedRoles[user.id] = [...user.roles];
    });
  },
  { immediate: true },
);

const saveName = async (userId: number): Promise<void> => {
  if (pendingAction.value !== null || !can("users.update")) return;
  pendingAction.value = { kind: "name", userId };
  try {
    await updateMutation.mutateAsync({
      userId,
      payload: { name: editedNames[userId] },
    });
    feedback.reportSuccess("Nome atualizado com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  } finally {
    pendingAction.value = null;
  }
};
const saveRoles = async (userId: number): Promise<void> => {
  if (pendingAction.value !== null || !can("users.assign-roles")) return;
  pendingAction.value = { kind: "roles", userId };
  try {
    const roles = editedRoles[userId] ?? [];
    await rolesMutation.mutateAsync({ userId, payload: { roles } });
    feedback.reportSuccess("Papéis atualizados com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  } finally {
    pendingAction.value = null;
  }
};
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
const createNewUser = async (): Promise<void> => {
  if (pendingAction.value !== null || !can("users.manage")) return;
  if (!/^\d{11}$/.test(newUser.cpf)) {
    feedback.handleFailure(new Error("cpf-local"));
    feedback.clearFeedback();
    feedback.fieldErrors.value = {
      ...feedback.fieldErrors.value,
      cpf: ["Informe um CPF válido com 11 dígitos."],
    };
    return;
  }
  if (newUser.password.length < 12) {
    feedback.clearFeedback();
    feedback.fieldErrors.value = {
      password: ["A senha deve ter pelo menos 12 caracteres."],
    };
    return;
  }
  pendingAction.value = { kind: "create", userId: 0 };
  try {
    await createMutation.mutateAsync({
      name: newUser.name,
      email: newUser.email,
      cpf: newUser.cpf,
      password: newUser.password,
      active: newUser.active,
    });
    newUser.name = "";
    newUser.email = "";
    newUser.cpf = "";
    newUser.password = "";
    newUser.active = false;
    feedback.reportSuccess("Usuário criado com sucesso.");
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
.filters,
.create-form {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
}

.filters {
  margin-bottom: 0;
}

.selection-counter {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.875rem;
}

.create-form {
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

td:nth-child(2),
td:nth-child(5) {
  display: flex;
  gap: 0.5rem;
}

.user-link {
  align-self: center;
  color: var(--color-evergreen, #314830);
  font-weight: 600;
  text-decoration: none;
}

.user-link:hover {
  text-decoration: underline;
}
</style>
