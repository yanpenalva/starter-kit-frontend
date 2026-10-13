<template>
  <DialogComponent
    :model-value="modelValue"
    title="Criar usuário"
    @update:model-value="handleDialogVisibility"
  >
    <form
      :id="formId"
      class="user-form"
      aria-label="Formulário de novo usuário"
      @submit.prevent="submit"
    >
      <p class="user-form__hint">
        Selecione um ou mais perfis. O usuário e os perfis serão criados em uma
        única operação.
      </p>
      <div class="user-form__row">
        <label>
          Nome
          <input
            v-model="form.name"
            aria-label="Nome do novo usuário"
            autofocus
            required
          />
        </label>
        <label>
          CPF
          <input
            v-model="form.cpf"
            aria-label="CPF do novo usuário"
            inputmode="numeric"
            required
          />
          <FieldErrors
            :errors="feedback.fieldErrors.value.cpf ?? []"
            field-label="CPF do novo usuário"
          />
        </label>
      </div>
      <label>
        Email
        <input
          v-model="form.email"
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
        Senha (mínimo 12 caracteres)
        <input
          v-model="form.password"
          aria-label="Senha do novo usuário"
          type="password"
          minlength="12"
          required
        />
        <FieldErrors
          :errors="feedback.fieldErrors.value.password ?? []"
          field-label="Senha do novo usuário"
        />
      </label>
      <label class="user-form__active">
        <input
          v-model="form.active"
          aria-label="Ativar novo usuário imediatamente"
          type="checkbox"
        />
        Ativo
      </label>
      <section
        class="user-form__roles user-form__roles--scroll"
        aria-labelledby="user-create-roles-title"
      >
        <h3 id="user-create-roles-title">Perfis (obrigatório)</h3>
        <p
          v-if="!can('users.manage')"
          class="user-form__permission"
          role="alert"
        >
          A permissão users.manage é necessária para criar usuários.
        </p>
        <p
          v-if="can('users.manage') && !canAssignRoles"
          class="user-form__permission"
          role="alert"
        >
          A permissão users.assign-roles é necessária para criar um usuário com
          perfis.
        </p>
        <RoleMultiSelect
          v-if="can('users.manage') && canAssignRoles"
          :model-value="roles"
          aria-label="Perfis do novo usuário"
          :required="true"
          :can-view-catalog="props.modelValue && can('roles.view')"
          :disabled="isPending"
          @update:model-value="roles = $event"
        />
        <FieldErrors
          :errors="roleErrors"
          field-label="Perfis do novo usuário"
        />
      </section>
    </form>

    <FormFeedback :feedback="feedback" />

    <template #actions>
      <button
        type="button"
        class="ui-control"
        data-testid="cancel-create"
        :disabled="isPending"
        @click="requestClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="ui-control ui-control--primary"
        data-testid="submit-create-user"
        :form="formId"
        :disabled="isPending"
      >
        {{ isPending ? "Criando..." : "Criar usuário" }}
      </button>
    </template>
  </DialogComponent>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import RoleMultiSelect from "@/shared/components/RoleMultiSelect.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useFormDismissGuard } from "@/shared/composables/useFormDismissGuard";
import { useUserMutations } from "@/features/users/composables/useUsersList";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  created: [];
}>();

const { can } = useAuthorization();
const { createMutation } = useUserMutations();
const feedback = useFormFeedback();
const formId = `user-form-create-${useId()}`;
const roles = ref<string[]>([]);
const canAssignRoles = computed(() => can("users.assign-roles"));
const roleErrors = computed(() =>
  Object.entries(feedback.fieldErrors.value)
    .filter(([field]) => field === "roles" || field.startsWith("roles."))
    .flatMap(([, errors]) => errors),
);

const form = reactive({
  name: "",
  email: "",
  cpf: "",
  password: "",
  active: false,
});

const isPending = computed(() => createMutation.isPending.value);

const isDirty = computed(
  () =>
    form.name !== "" ||
    form.email !== "" ||
    form.cpf !== "" ||
    form.password !== "" ||
    form.active ||
    roles.value.length > 0,
);

const { canDismiss } = useFormDismissGuard({
  isDirty: () => isDirty.value,
  isPending: () => isPending.value,
  message: "Há dados não salvos. Descartar o novo usuário?",
});

const resetForm = (): void => {
  form.name = "";
  form.email = "";
  form.cpf = "";
  form.password = "";
  form.active = false;
  roles.value = [];
  feedback.clearFeedback();
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm();
  },
  { immediate: true },
);

const requestClose = (): void => {
  if (!canDismiss()) return;

  resetForm();
  emit("update:modelValue", false);
};

const handleDialogVisibility = (value: boolean): void => {
  if (value) return;
  requestClose();
};

const submit = async (): Promise<void> => {
  if (isPending.value || !can("users.manage") || !canAssignRoles.value) return;
  if (!/^\d{11}$/.test(form.cpf)) {
    feedback.clearFeedback();
    feedback.fieldErrors.value = {
      cpf: ["Informe um CPF válido com 11 dígitos."],
    };
    return;
  }
  if (form.password.length < 12) {
    feedback.clearFeedback();
    feedback.fieldErrors.value = {
      password: ["A senha deve ter pelo menos 12 caracteres."],
    };
    return;
  }
  if (roles.value.length === 0) {
    feedback.clearFeedback();
    feedback.fieldErrors.value = {
      roles: ["Selecione ao menos um perfil."],
    };
    return;
  }
  try {
    await createMutation.mutateAsync({
      name: form.name,
      email: form.email,
      cpf: form.cpf,
      password: form.password,
      active: form.active,
      roles: roles.value,
    });
    resetForm();
    emit("created");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  }
};
</script>

<style scoped>
.user-form {
  display: grid;
  gap: 0.75rem;
}

.user-form__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.user-form__hint {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.875rem;
}

.user-form__roles {
  display: grid;
  gap: 0.5rem;
}

.user-form__roles--scroll {
  max-height: 16rem;
  overflow-y: auto;
}

.user-form__roles h3 {
  margin: 0;
  font-size: 0.95rem;
}

.user-form__permission {
  margin: 0;
  color: #b42318;
  font-size: 0.8125rem;
}

.user-form label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.user-form input {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252a25);
}

.user-form__active {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-form__active input {
  min-height: 0;
  width: 1rem;
  height: 1rem;
}
</style>
