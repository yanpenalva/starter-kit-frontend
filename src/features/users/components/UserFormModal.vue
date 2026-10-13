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
import { computed, reactive, useId, watch } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useFormDismissGuard } from "@/shared/composables/useFormDismissGuard";
import { useUserMutations } from "@/features/users/composables/useUsersList";

/*
 * Criação em modal: o estado, a validação local do CPF/senha e o reset que
 * viviam na listagem foram extraídos para cá. O contrato da API continua o
 * mesmo (nome/email/CPF/senha mínima de 12/active); papéis não entram na
 * criação — a atribuição é um salvamento separado, com permissão própria.
 */
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
    form.active,
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
  feedback.clearFeedback();
};

// Reabrir não herda senha, draft nem erros de uma tentativa anterior.
watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm();
  },
  { immediate: true },
);

const requestClose = (): void => {
  if (!canDismiss()) return;
  // Descartar confirma o abandono do rascunho (inclusive a senha digitada).
  resetForm();
  emit("update:modelValue", false);
};

// Escape, backdrop e o botão Fechar do diálogo passam pela mesma regra do
// formulário: fechar só com descarte confirmado.
const handleDialogVisibility = (value: boolean): void => {
  if (value) return;
  requestClose();
};

const submit = async (): Promise<void> => {
  if (isPending.value || !can("users.manage")) return;
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
  try {
    await createMutation.mutateAsync({
      name: form.name,
      email: form.email,
      cpf: form.cpf,
      password: form.password,
      active: form.active,
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
