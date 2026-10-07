<template>
  <AuthLayout
    title="Crie sua conta"
    description="Preencha seus dados para ter acesso ao painel do Starter Kit."
    eyebrow="CADASTRO"
  >
    <form class="register-form" @submit.prevent="handleSubmit">
      <div v-if="errorMessage" role="alert" class="register-form__alert">
        {{ errorMessage }}
      </div>

      <div class="register-form__field">
        <label for="register-name" class="register-form__label"
          >Nome completo</label
        >
        <input
          id="register-name"
          v-model="name"
          type="text"
          required
          maxlength="255"
          autocomplete="name"
          class="register-form__input"
          placeholder="Seu nome completo"
          :aria-invalid="fieldErrors.name ? 'true' : undefined"
          :aria-describedby="fieldErrors.name ? 'register-name-error' : undefined"
        />
        <span
          v-if="fieldErrors.name"
          id="register-name-error"
          class="register-form__field-error"
        >
          {{ fieldErrors.name[0] }}
        </span>
      </div>

      <div class="register-form__field">
        <label for="register-email" class="register-form__label">E-mail</label>
        <input
          id="register-email"
          v-model="email"
          type="email"
          required
          maxlength="255"
          autocomplete="email"
          class="register-form__input"
          placeholder="seu@email.com"
          :aria-invalid="fieldErrors.email ? 'true' : undefined"
          :aria-describedby="fieldErrors.email ? 'register-email-error' : undefined"
        />
        <span
          v-if="fieldErrors.email"
          id="register-email-error"
          class="register-form__field-error"
        >
          {{ fieldErrors.email[0] }}
        </span>
      </div>

      <div class="register-form__field">
        <label for="register-cpf" class="register-form__label">
          CPF <span class="register-form__optional">(opcional)</span>
        </label>
        <input
          id="register-cpf"
          v-model="cpf"
          type="text"
          maxlength="14"
          autocomplete="off"
          class="register-form__input"
          placeholder="000.000.000-00"
          :aria-invalid="fieldErrors.cpf ? 'true' : undefined"
          :aria-describedby="fieldErrors.cpf ? 'register-cpf-error' : undefined"
        />
        <span
          v-if="fieldErrors.cpf"
          id="register-cpf-error"
          class="register-form__field-error"
        >
          {{ fieldErrors.cpf[0] }}
        </span>
      </div>

      <div class="register-form__field">
        <label for="register-password" class="register-form__label"
          >Senha</label
        >
        <input
          id="register-password"
          v-model="password"
          type="password"
          required
          minlength="12"
          autocomplete="new-password"
          class="register-form__input"
          placeholder="Pelo menos 12 caracteres"
          :aria-invalid="fieldErrors.password ? 'true' : undefined"
          :aria-describedby="fieldErrors.password ? 'register-password-error' : undefined"
        />
        <span
          v-if="fieldErrors.password"
          id="register-password-error"
          class="register-form__field-error"
        >
          {{ fieldErrors.password[0] }}
        </span>
      </div>

      <div class="register-form__field">
        <label
          for="register-password-confirmation"
          class="register-form__label"
        >
          Confirmação da senha
        </label>
        <input
          id="register-password-confirmation"
          v-model="passwordConfirmation"
          type="password"
          required
          minlength="12"
          autocomplete="new-password"
          class="register-form__input"
          placeholder="Repita a senha"
          :aria-invalid="fieldErrors.password_confirmation ? 'true' : undefined"
          :aria-describedby="fieldErrors.password_confirmation ? 'register-password-confirmation-error' : undefined"
        />
        <span
          v-if="fieldErrors.password_confirmation"
          id="register-password-confirmation-error"
          class="register-form__field-error"
        >
          {{ fieldErrors.password_confirmation[0] }}
        </span>
      </div>

      <button
        type="submit"
        class="register-form__submit-btn"
        :disabled="isLoading"
      >
        <span v-if="isLoading">Criando conta...</span>
        <span v-else>Criar conta</span>
      </button>

      <div class="register-form__help">
        <RouterLink to="/login" class="register-form__link">
          Já possui uma conta? Entrar
        </RouterLink>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import AuthLayout from "@/shared/layouts/AuthLayout.vue";
import { useSessionStore } from "../stores/session";
import { normalizeCpf, validateCpf } from "../utils/cpf";
import {
  isCsrfMismatchHttpError,
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
} from "@/lib/http";
const name = ref("");
const email = ref("");
const cpf = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const fieldErrors = ref<Record<string, readonly string[]>>({});
const session = useSessionStore();
const router = useRouter();
const focusFirstInvalidField = async () => {
  await nextTick();
  const firstInvalidField = document
    .querySelector<HTMLFormElement>(".register-form")
    ?.querySelector<HTMLInputElement>('[aria-invalid="true"]');
  firstInvalidField?.focus();
};
const handleSubmit = async () => {
  errorMessage.value = null;
  fieldErrors.value = {};
  if (
    !name.value ||
    !email.value ||
    !password.value ||
    !passwordConfirmation.value
  ) {
    errorMessage.value = "Preencha todos os campos obrigatórios.";
    return;
  }
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = "As senhas não conferem.";
    return;
  }
  if (password.value.length < 12) {
    errorMessage.value = "A senha deve ter pelo menos 12 caracteres.";
    return;
  }
  if (cpf.value && !validateCpf(cpf.value)) {
    errorMessage.value = "Os dígitos verificadores do campo cpf são inválidos.";
    return;
  }
  isLoading.value = true;
  try {
    const normalizedCpfValue = normalizeCpf(cpf.value);
    await session.register({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
      cpf: normalizedCpfValue,
    });
    await router.push({
      name: "login",
      query: { registered: "1" },
    });
  } catch (error: unknown) {
    if (isValidationHttpError(error)) {
      fieldErrors.value = error.fieldErrors;
      const firstField = Object.keys(error.fieldErrors)[0];
      const firstError = firstField
        ? error.fieldErrors[firstField]?.[0]
        : undefined;
      errorMessage.value = firstError ?? "Verifique os dados informados.";
      await focusFirstInvalidField();
    } else if (isRateLimitedHttpError(error)) {
      if (error.retryAfterSeconds !== null) {
        errorMessage.value = `Muitas tentativas. Tente novamente em ${error.retryAfterSeconds} segundos.`;
      } else {
        errorMessage.value =
          "Muitas tentativas. Aguarde antes de tentar novamente.";
      }
    } else if (isCsrfMismatchHttpError(error)) {
      errorMessage.value = "Sessão expirada. Tente novamente.";
    } else if (isHttpError(error)) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value =
        "Não foi possível conectar ao serviço. Verifique sua conexão.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  width: 100%;
}

.register-form__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.register-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.register-form__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink, #252b25);
}

.register-form__optional {
  font-weight: 400;
  color: var(--color-muted, #666);
}

.register-form__input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: var(--color-canvas, #fff);
  color: var(--color-ink, #252b25);
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color var(--motion-quick, 150ms) ease;
}

.register-form__input:focus {
  outline: none;
  border-color: var(--color-evergreen, #314830);
  box-shadow: 0 0 0 3px rgb(49 72 48 / 12%);
}

.register-form__field-error {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.125rem;
}

.register-form__submit-btn {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: var(--color-evergreen, #314830);
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--motion-quick, 150ms) ease;
}

.register-form__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-form__help {
  text-align: center;
  margin-top: 0.5rem;
}

.register-form__link {
  color: var(--color-muted, #666);
  font-size: 0.8125rem;
  text-decoration: none;
}

.register-form__link:hover {
  color: var(--color-evergreen, #314830);
}
</style>
