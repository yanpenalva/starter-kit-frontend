<template>
  <AuthLayout
    title="Verifique sua identidade"
    description="Informe o código de autenticação para concluir seu acesso."
    eyebrow="AUTENTICAÇÃO EM DUAS ETAPAS"
  >
    <form class="mfa-form" @submit.prevent="handleSubmit">
      <div v-if="errorMessage" role="alert" class="mfa-form__alert">
        {{ errorMessage }}
      </div>

      <div v-if="!recoveryMode" class="mfa-form__field">
        <label for="mfa-code" class="mfa-form__label">
          Código de autenticação
        </label>
        <input
          id="mfa-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]{6}"
          maxlength="6"
          required
          class="mfa-form__input"
          :aria-invalid="(fieldErrors.code?.length ?? 0) > 0"
          aria-describedby="mfa-code-help"
        />
        <p id="mfa-code-help" class="mfa-form__hint">
          Digite os seis dígitos do seu aplicativo autenticador.
        </p>
        <FieldErrors :errors="fieldErrors.code ?? []" field-label="Código" />
      </div>

      <div v-if="recoveryMode" class="mfa-form__field">
        <label for="mfa-recovery-code" class="mfa-form__label">
          Código de recuperação
        </label>
        <input
          id="mfa-recovery-code"
          v-model="code"
          type="text"
          autocomplete="off"
          required
          class="mfa-form__input"
          :aria-invalid="
            (fieldErrors.recovery_code?.length ??
              fieldErrors.code?.length ??
              0) > 0
          "
        />
        <FieldErrors
          :errors="fieldErrors.recovery_code ?? fieldErrors.code ?? []"
          field-label="Código de recuperação"
        />
      </div>

      <button type="submit" class="mfa-form__submit-btn" :disabled="isLoading">
        <span v-if="isLoading">Verificando...</span>
        <span v-if="!isLoading">Continuar</span>
      </button>

      <button
        v-if="!recoveryMode"
        type="button"
        class="mfa-form__toggle"
        @click="toggleMode"
      >
        usar código de recuperação
      </button>
      <button
        v-if="recoveryMode"
        type="button"
        class="mfa-form__toggle"
        @click="toggleMode"
      >
        usar código de autenticação
      </button>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthLayout from "@/shared/layouts/AuthLayout.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useSessionStore } from "@/features/auth/stores/session";
import type { MfaChallengeRequest } from "@/features/auth/api/auth.api";

const session = useSessionStore();
const router = useRouter();
const route = useRoute();
const code = ref("");
const recoveryMode = ref(false);
const isLoading = ref(false);
const { fieldErrors, errorMessage, clearFeedback, handleFailure } =
  useFormFeedback();

const isValidRedirect = (redirect: unknown): redirect is string => {
  if (typeof redirect !== "string") return false;
  return (
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    !redirect.startsWith("/\\")
  );
};

const challengePayload = (): MfaChallengeRequest => {
  if (recoveryMode.value) {
    return { recovery_code: code.value };
  }
  return { code: code.value };
};

const toggleMode = (): void => {
  recoveryMode.value = !recoveryMode.value;
  code.value = "";
  clearFeedback();
};

const handleSubmit = async (): Promise<void> => {
  if (isLoading.value || !code.value) return;
  isLoading.value = true;
  clearFeedback();
  const payload = challengePayload();
  try {
    await session.completeChallenge(payload);
    const redirectTarget = route.query.redirect;
    if (isValidRedirect(redirectTarget)) {
      await router.push(redirectTarget);
      return;
    }
    await router.push({ name: "dashboard" });
  } catch (error: unknown) {
    handleFailure(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.mfa-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.mfa-form__alert {
  padding: 0.75rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.mfa-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.mfa-form__label {
  color: var(--color-ink, #252b25);
  font-size: 0.8125rem;
  font-weight: 600;
}

.mfa-form__input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: var(--color-canvas, #fff);
  color: var(--color-ink, #252b25);
  font: inherit;
}

.mfa-form__hint {
  margin: 0;
  color: var(--color-muted, #657267);
  font-size: 0.8125rem;
}

.mfa-form__submit-btn {
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-evergreen, #234b35);
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.mfa-form__submit-btn:disabled {
  cursor: wait;
  opacity: 0.65;
}

.mfa-form__toggle {
  align-self: center;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--color-evergreen, #234b35);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
}

.mfa-form__toggle:focus-visible,
.mfa-form__submit-btn:focus-visible,
.mfa-form__input:focus-visible {
  outline: 3px solid var(--color-focus, #85b8e6);
  outline-offset: 3px;
}
</style>
