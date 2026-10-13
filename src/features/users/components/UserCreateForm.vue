<script setup lang="ts">
import { reactive, watch } from "vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import type { StoreUserRequest } from "@/lib/api/generated/models/storeUserRequest";

const props = defineProps<{
  disabled: boolean;
  fieldErrors: Readonly<Record<string, readonly string[]>>;
  resetKey: number;
}>();

const emit = defineEmits<{
  submit: [payload: StoreUserRequest];
}>();

const createEmptyForm = (): StoreUserRequest => ({
  name: "",
  email: "",
  cpf: "",
  password: "",
  active: false,
});

const form = reactive<StoreUserRequest>(createEmptyForm());

const resetForm = (): void => {
  Object.assign(form, createEmptyForm());
};

const submit = (): void => {
  emit("submit", { ...form });
};

watch(() => props.resetKey, resetForm);
</script>

<template>
  <form class="create-form" aria-label="Criar usuário" @submit.prevent="submit">
    <label>
      Nome
      <input v-model="form.name" aria-label="Nome do novo usuário" required />
    </label>
    <label>
      Email
      <input
        v-model="form.email"
        aria-label="Email do novo usuário"
        type="email"
        required
      />
      <FieldErrors
        :errors="fieldErrors.email ?? []"
        field-label="Email do novo usuário"
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
        :errors="fieldErrors.cpf ?? []"
        field-label="CPF do novo usuário"
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
    </label>
    <label>
      <input
        v-model="form.active"
        aria-label="Ativar novo usuário imediatamente"
        type="checkbox"
      />
      Ativo
    </label>
    <button type="submit" :disabled="disabled">Criar usuário</button>
  </form>
</template>

<style scoped>
.create-form {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

label {
  display: grid;
  gap: 0.375rem;
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
</style>
