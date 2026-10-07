<template>
  <AuthLayout
    title="Recuperar senha"
    description="Informe seu e-mail para receber as instruções de redefinição de senha."
    eyebrow="RECUPERAÇÃO"
  >
    <div v-if="submittedMessage" class="forgot-success">
      <div role="status" class="forgot-success__message">
        {{ submittedMessage }}
      </div>
      <p class="forgot-success__help">
        Verifique sua caixa de entrada e siga as instruções contidas no e-mail.
      </p>
      <RouterLink
        to="/login"
        class="forgot-form__submit-btn forgot-success__btn"
      >
        Voltar para o login
      </RouterLink>
    </div>

    <form v-else class="forgot-form" @submit.prevent="handleSubmit">
      <div v-if="errorMessage" role="alert" class="forgot-form__alert">
        {{ errorMessage }}
      </div>

      <div class="forgot-form__field">
        <label for="forgot-email" class="forgot-form__label"
          >E-mail cadastrado</label
        >
        <input
          id="forgot-email"
          v-model="email"
          type="email"
          required
          maxlength="255"
          autocomplete="email"
          class="forgot-form__input"
          placeholder="seu@email.com"
        />
      </div>

      <button
        type="submit"
        class="forgot-form__submit-btn"
        :disabled="isLoading"
      >
        <span v-if="isLoading">Enviando...</span>
        <span v-else>Enviar instruções</span>
      </button>

      <div class="forgot-form__help">
        <RouterLink to="/login" class="forgot-form__link">
          Lembrou sua senha? Voltar para o login
        </RouterLink>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import AuthLayout from "@/shared/layouts/AuthLayout.vue";
import { useSessionStore } from "@/features/auth/stores/session";
import {
  isCsrfMismatchHttpError,
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
} from "@/lib/http";
const email = ref("");
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const submittedMessage = ref<string | null>(null);
const session = useSessionStore();
const handleSubmit = async () => {
  if (isLoading.value) return;
  if (!email.value) return;
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const response = await session.forgotPassword({ email: email.value });
    submittedMessage.value =
      response.message || "Se o email existir, enviamos o link.";
  } catch (error: unknown) {
    if (isRateLimitedHttpError(error)) {
      if (error.retryAfterSeconds !== null) {
        errorMessage.value = `Muitas tentativas. Tente novamente em ${error.retryAfterSeconds} segundos.`;
      } else {
        errorMessage.value =
          "Muitas tentativas. Aguarde antes de tentar novamente.";
      }
    } else if (isValidationHttpError(error)) {
      errorMessage.value = "Informe um endereço de e-mail válido.";
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
.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.forgot-form__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.forgot-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.forgot-form__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink, #252b25);
}

.forgot-form__input {
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

.forgot-form__input:focus {
  outline: none;
  border-color: var(--color-evergreen, #314830);
  box-shadow: 0 0 0 3px rgb(49 72 48 / 12%);
}

.forgot-form__submit-btn {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: var(--color-evergreen, #314830);
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: opacity var(--motion-quick, 150ms) ease;
}

.forgot-form__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-form__help {
  text-align: center;
  margin-top: 0.5rem;
}

.forgot-form__link {
  color: var(--color-muted, #666);
  font-size: 0.8125rem;
  text-decoration: none;
}

.forgot-form__link:hover {
  color: var(--color-evergreen, #314830);
}

.forgot-success {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.forgot-success__message {
  padding: 1rem;
  border-radius: 0.375rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.forgot-success__help {
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
  line-height: 1.5;
}

.forgot-success__btn {
  margin-top: 0.5rem;
}
</style>
