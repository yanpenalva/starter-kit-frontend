<template>
  <AuthLayout
    title="Redefinir senha"
    description="Escolha uma nova senha segura para acessar sua conta."
    eyebrow="RECUPERAÇÃO"
  >
    <div v-if="missingParameters" role="alert" class="reset-form__alert">
      Parâmetros de redefinição ausentes ou inválidos. Por favor, solicite um
      novo link de recuperação.
      <div class="reset-form__help" style="margin-top: 0.75rem">
        <RouterLink to="/forgot-password" class="reset-form__link">
          Solicitar novo link
        </RouterLink>
      </div>
    </div>

    <form v-else class="reset-form" @submit.prevent="handleSubmit">
      <div v-if="errorMessage" role="alert" class="reset-form__alert">
        {{ errorMessage }}
      </div>

      <div class="reset-form__field">
        <label for="reset-email" class="reset-form__label">E-mail</label>
        <input
          id="reset-email"
          v-model="email"
          type="email"
          required
          readonly
          class="reset-form__input reset-form__input--readonly"
        />
      </div>

      <div class="reset-form__field">
        <label for="reset-password" class="reset-form__label">Nova senha</label>
        <input
          id="reset-password"
          v-model="password"
          type="password"
          required
          minlength="12"
          autocomplete="new-password"
          class="reset-form__input"
          placeholder="Pelo menos 12 caracteres"
        />
      </div>

      <div class="reset-form__field">
        <label for="reset-password-confirmation" class="reset-form__label">
          Confirmar nova senha
        </label>
        <input
          id="reset-password-confirmation"
          v-model="passwordConfirmation"
          type="password"
          required
          minlength="12"
          autocomplete="new-password"
          class="reset-form__input"
          placeholder="Repita a nova senha"
        />
      </div>

      <button
        type="submit"
        class="reset-form__submit-btn"
        :disabled="isLoading"
      >
        <span v-if="isLoading">Redefinindo senha...</span>
        <span v-else>Redefinir senha</span>
      </button>

      <div class="reset-form__help">
        <RouterLink to="/login" class="reset-form__link">
          Voltar para o login
        </RouterLink>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AuthLayout from "@/shared/layouts/AuthLayout.vue";
import { useSessionStore } from "@/features/auth/stores/session";
import {
  isCsrfMismatchHttpError,
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
} from "@/lib/http";
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const token = computed(() => {
  const t = route.query.token;
  return typeof t === "string" ? t : "";
});
const email = ref(
  typeof route.query.email === "string" ? route.query.email : "",
);
const missingParameters = computed(() => !token.value || !email.value);
const password = ref("");
const passwordConfirmation = ref("");
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const handleSubmit = async () => {
  if (isLoading.value) return;
  if (!password.value || !passwordConfirmation.value) {
    errorMessage.value = "Preencha todos os campos.";
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
  isLoading.value = true;
  errorMessage.value = null;
  try {
    await session.resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
    await router.push({
      name: "login",
      query: { reset: "ok" },
    });
  } catch (error: unknown) {
    if (isValidationHttpError(error)) {
      const firstField = Object.keys(error.fieldErrors)[0];
      const firstError = firstField
        ? error.fieldErrors[firstField]?.[0]
        : undefined;
      errorMessage.value =
        firstError ?? "Dados de redefinição inválidos ou expirados.";
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
.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.reset-form__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.reset-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.reset-form__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink, #252b25);
}

.reset-form__input {
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

.reset-form__input--readonly {
  background: #f3f4f6;
  color: #4b5563;
  cursor: default;
}

.reset-form__input:focus {
  outline: none;
  border-color: var(--color-evergreen, #314830);
  box-shadow: 0 0 0 3px rgb(49 72 48 / 12%);
}

.reset-form__submit-btn {
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

.reset-form__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-form__help {
  text-align: center;
  margin-top: 0.5rem;
}

.reset-form__link {
  color: var(--color-muted, #666);
  font-size: 0.8125rem;
  text-decoration: none;
}

.reset-form__link:hover {
  color: var(--color-evergreen, #314830);
}
</style>
