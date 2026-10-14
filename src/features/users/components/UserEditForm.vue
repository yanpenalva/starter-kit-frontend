<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    @update:model-value="handleDialogVisibility"
  >
    <p v-if="user === null" role="status">Carregando usuário...</p>

    <template v-if="user !== null">
      <form
        :id="dadosFormId"
        class="user-edit"
        aria-label="Editar dados do usuário"
        @submit.prevent="saveProfile"
      >
        <h3 class="user-edit__block-title">Dados</h3>
        <div class="user-edit__grid">
          <label>
            Nome
            <RequiredMark />
            <input
              v-model="form.name"
              data-testid="edit-name"
              aria-label="Nome do usuário"
              autofocus
              required
            />
          </label>
          <label>
            Email
            <RequiredMark />
            <input
              v-model="form.email"
              data-testid="edit-email"
              aria-label="Email do usuário"
              type="email"
              required
            />
            <FieldErrors
              :errors="profileFeedback.fieldErrors.value.email ?? []"
              field-label="Email do usuário"
            />
          </label>
          <label v-if="can('users.read-cpf')">
            CPF
            <input
              v-model="form.cpf"
              data-testid="edit-cpf"
              aria-label="CPF do usuário"
              inputmode="numeric"
              maxlength="14"
            />
            <FieldErrors
              :errors="profileFeedback.fieldErrors.value.cpf ?? []"
              field-label="CPF do usuário"
            />
          </label>
        </div>
        <FormFeedback :feedback="profileFeedback" />
      </form>

      <section class="user-edit__roles" aria-labelledby="user-edit-roles-title">
        <h3 id="user-edit-roles-title" class="user-edit__block-title">
          Perfis
        </h3>
        <template v-if="canAssignRoles">
          <RoleMultiSelect
            :model-value="rolesSelection"
            :aria-label="`Perfis de ${user.name}`"
            :can-view-catalog="can('roles.view')"
            :disabled="rolesPending"
            @update:model-value="rolesSelection = $event"
          />
          <p
            v-if="isRolesDirty && rolesSelection.length === 0"
            class="user-edit__roles-empty"
            role="alert"
          >
            Selecione ao menos um perfil. Uma atribuição vazia não pode ser
            salva.
          </p>
          <FormFeedback :feedback="rolesFeedback" />
          <button
            type="button"
            class="ui-control"
            :aria-label="`Salvar perfis de ${user.name}`"
            :disabled="!canSaveRoles"
            @click="saveRoles"
          >
            {{ rolesPending ? "Salvando..." : "Salvar perfis" }}
          </button>
        </template>
        <p
          v-if="!canAssignRoles"
          class="user-edit__readonly"
          data-testid="roles-readonly"
        >
          {{
            user.roles.length === 0
              ? "Nenhum perfil"
              : user.roles.map(roleLabel).join(", ")
          }}
        </p>
      </section>
    </template>

    <template #actions>
      <button
        type="button"
        class="ui-control"
        data-testid="cancel-edit"
        :disabled="isPending"
        @click="requestClose"
      >
        Cancelar
      </button>
      <button
        v-if="can('users.update')"
        type="submit"
        class="ui-control ui-control--primary"
        data-testid="save-user"
        :form="dadosFormId"
        :disabled="!canSaveProfile"
      >
        {{ profilePending ? "Salvando..." : "Salvar alterações" }}
      </button>
    </template>
  </DialogComponent>
  <ConfirmDialog
    :model-value="confirmOpen"
    title="Descartar alterações"
    :message="dismissMessage"
    confirm-label="Descartar alterações"
    :busy="isPending"
    @update:model-value="cancelDismiss"
    @confirm="confirmDismiss"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import RequiredMark from "@/shared/components/RequiredMark.vue";
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import RoleMultiSelect from "@/shared/components/RoleMultiSelect.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { roleLabel } from "@/shared/utils/role-labels";
import { useFormDismissGuard } from "@/shared/composables/useFormDismissGuard";
import { useUserMutations } from "@/features/users/composables/useUsersList";
import { formatCpf } from "@/features/users/utils/cpf-mask";
import type { AdminUser } from "@/features/users/api/users.types";

const props = defineProps<{
  modelValue: boolean;
  user: AdminUser | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "profile-saved": [];
  "roles-saved": [];
}>();

const { can } = useAuthorization();
const canAssignRoles = computed(() => can("users.assign-roles"));
const { updateMutation, rolesMutation } = useUserMutations();
const profileFeedback = useFormFeedback();
const rolesFeedback = useFormFeedback();
const dadosFormId = `user-form-edit-${useId()}`;

const form = reactive({ name: "", email: "", cpf: "" });
const saved = reactive({ name: "", email: "", cpf: "" });
const rolesSelection = ref<string[]>([]);
const savedRoles = ref<string[]>([]);

const title = computed(() =>
  props.user === null ? "Editar usuário" : `Editar ${props.user.name}`,
);

const seed = (): void => {
  const value = props.user;
  if (value === null) return;
  form.name = value.name;
  form.email = value.email;
  form.cpf = formatCpf(value.cpf ?? "") ?? "";
  saved.name = form.name;
  saved.email = form.email;
  saved.cpf = form.cpf;
  rolesSelection.value = [...value.roles];
  savedRoles.value = [...value.roles];
  profileFeedback.clearFeedback();
  rolesFeedback.clearFeedback();
};

watch(
  [() => props.modelValue, () => props.user?.id],
  ([open]) => {
    if (open) seed();
  },
  { immediate: true },
);

const isProfileDirty = computed(
  () =>
    form.name !== saved.name ||
    form.email !== saved.email ||
    form.cpf !== saved.cpf,
);
const isRolesDirty = computed(
  () =>
    rolesSelection.value.length !== savedRoles.value.length ||
    rolesSelection.value.some((role) => !savedRoles.value.includes(role)),
);
const isDirty = computed(() => isProfileDirty.value || isRolesDirty.value);

const profilePending = computed(() => updateMutation.isPending.value);
const rolesPending = computed(() => rolesMutation.isPending.value);
const isPending = computed(() => profilePending.value || rolesPending.value);

const canSaveProfile = computed(
  () => can("users.update") && isProfileDirty.value && !profilePending.value,
);
const canSaveRoles = computed(
  () =>
    can("users.assign-roles") &&
    isRolesDirty.value &&
    rolesSelection.value.length > 0 &&
    !rolesPending.value,
);

const {
  confirmOpen,
  message: dismissMessage,
  requestDismiss,
  confirmDismiss,
  cancelDismiss,
} = useFormDismissGuard({
  isDirty: () => isDirty.value,
  isPending: () => isPending.value,
  message: "Há alterações não salvas. Descartar as mudanças?",
});

const requestClose = (): void => {
  requestDismiss(() => {
    seed();
    emit("update:modelValue", false);
  });
};

const handleDialogVisibility = (value: boolean): void => {
  if (value) return;
  requestClose();
};

const commitRoles = (): void => {
  savedRoles.value = [...rolesSelection.value];
};

const saveProfile = async (): Promise<void> => {
  const userId = props.user?.id;
  if (userId === undefined || !canSaveProfile.value) return;
  const payload: { name?: string; email?: string; cpf?: string | null } = {};
  if (form.name !== saved.name) payload.name = form.name;
  if (form.email !== saved.email) payload.email = form.email;
  if (form.cpf !== saved.cpf) {
    payload.cpf = form.cpf === "" ? null : form.cpf;
  }
  if (Object.keys(payload).length === 0) return;
  try {
    await updateMutation.mutateAsync({ userId, payload });
    saved.name = form.name;
    saved.email = form.email;
    saved.cpf = form.cpf;
    emit("profile-saved");
  } catch (error: unknown) {
    profileFeedback.handleFailure(error);
  }
};

const saveRoles = async (): Promise<void> => {
  const userId = props.user?.id;
  if (userId === undefined || !canSaveRoles.value) return;
  try {
    await rolesMutation.mutateAsync({
      userId,
      payload: { roles: [...rolesSelection.value] },
    });
    commitRoles();
    emit("roles-saved");
  } catch (error: unknown) {
    rolesFeedback.handleFailure(error);
  }
};
</script>

<style scoped>
.user-edit {
  display: grid;
  gap: 0.75rem;
}

.user-edit__block-title {
  margin: 0;
  color: var(--color-evergreen, #456b56);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.user-edit__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
}

.user-edit label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.user-edit input {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252a25);
}

.user-edit__roles {
  display: grid;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgb(58 77 60 / 10%);
}

.user-edit__readonly {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.875rem;
}

.user-edit__roles-empty {
  margin: 0;
  color: #b42318;
  font-size: 0.875rem;
}
</style>
