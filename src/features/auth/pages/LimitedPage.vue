<template>
  <div class="limited-page">
    <main id="limited-content" class="limited-card" role="main">
      <span class="limited-card__tag">SESSÃO LIMITADA</span>
      <h1 class="limited-card__title">Verificação de E-mail Pendente</h1>
      <p class="limited-card__message">
        Sua conta foi criada, mas o e-mail
        <strong>{{ user?.email }}</strong>
        ainda não foi confirmado. O acesso às funcionalidades de negócio
        permanece restrito até a verificação.
      </p>

      <p class="limited-card__instruction">
        Por favor, verifique sua caixa de entrada e clique no link de ativação
        enviado pela API.
      </p>

      <div
        v-if="resendSuccessMessage"
        role="status"
        class="limited-card__alert limited-card__alert--success"
      >
        {{ resendSuccessMessage }}
      </div>

      <div
        v-if="resendErrorMessage"
        role="alert"
        class="limited-card__alert limited-card__alert--danger"
      >
        {{ resendErrorMessage }}
      </div>

      <div class="limited-card__actions">
        <button
          type="button"
          class="limited-btn limited-btn--primary"
          :disabled="isChecking || isResending"
          @click="checkStatus"
        >
          {{ isChecking ? "Verificando..." : "Já confirmei meu e-mail" }}
        </button>

        <button
          type="button"
          class="limited-btn limited-btn--outline"
          :disabled="isChecking || isResending"
          @click="handleResend"
        >
          {{ isResending ? "Reenviando..." : "Reenviar e-mail" }}
        </button>

        <button
          type="button"
          class="limited-btn limited-btn--secondary"
          @click="handleLogout"
        >
          Sair da conta
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "../stores/session";
import { isHttpError, isRateLimitedHttpError } from "@/lib/http";
const session = useSessionStore();
const router = useRouter();
const user = computed(() => session.user);
const isChecking = ref(false);
const isResending = ref(false);
const resendSuccessMessage = ref<string | null>(null);
const resendErrorMessage = ref<string | null>(null);
const checkStatus = async () => {
  isChecking.value = true;
  try {
    const updated = await session.bootstrap(true);
    if (updated && updated.email_verified_at !== null) {
      await router.push({ name: "dashboard" });
    }
  } finally {
    isChecking.value = false;
  }
};
const handleResend = async () => {
  isResending.value = true;
  resendSuccessMessage.value = null;
  resendErrorMessage.value = null;
  try {
    const response = await session.resendVerification();
    resendSuccessMessage.value =
      response.message || "E-mail de verificação reenviado com sucesso.";
  } catch (error: unknown) {
    if (isRateLimitedHttpError(error)) {
      if (error.retryAfterSeconds !== null) {
        resendErrorMessage.value = `Muitas tentativas. Tente novamente em ${error.retryAfterSeconds} segundos.`;
      } else {
        resendErrorMessage.value =
          "Muitas tentativas. Aguarde antes de tentar novamente.";
      }
    } else if (isHttpError(error)) {
      resendErrorMessage.value = error.message;
    } else {
      resendErrorMessage.value =
        "Não foi possível conectar ao serviço. Verifique sua conexão.";
    }
  } finally {
    isResending.value = false;
  }
};
const handleLogout = async () => {
  await session.logout();
  await router.push({ name: "login" });
};
</script>

<style scoped>
.limited-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: var(--color-canvas, #fdfbf7);
  font-family: var(--type-body, inherit);
  color: var(--color-ink, #252b25);
}

.limited-card {
  width: min(100%, 34rem);
  padding: 2.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: white;
  box-shadow: var(--shadow-panel, 0 10px 25px -5px rgb(0 0 0 / 0.05));
  text-align: center;
}

.limited-card__tag {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  background: #fef3c7;
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.limited-card__title {
  margin: 0 0 1rem;
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.limited-card__message {
  margin: 0 0 1rem;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.limited-card__instruction {
  margin: 0 0 2rem;
  color: var(--color-ink, #252b25);
  font-size: 0.875rem;
  font-weight: 500;
}

.limited-card__actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.limited-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: opacity var(--motion-quick, 150ms) ease;
}

.limited-card__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1.25rem;
  text-align: left;
}

.limited-card__alert--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.limited-card__alert--danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.limited-btn--primary {
  background: var(--color-evergreen, #314830);
  color: white;
}

.limited-btn--outline {
  border: 1px solid var(--color-evergreen, #314830);
  background: transparent;
  color: var(--color-evergreen, #314830);
}

.limited-btn--secondary {
  background: rgb(58 77 60 / 10%);
  color: var(--color-ink, #252b25);
}
</style>
