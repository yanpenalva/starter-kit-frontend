<template>
  <div class="verify-page">
    <main id="verify-content" class="verify-card" role="main">
      <div v-if="isProcessing" class="verify-card__loading">
        <span class="verify-card__tag">VERIFICAÇÃO</span>
        <h1 class="verify-card__title">Verificando seu e-mail...</h1>
        <p class="verify-card__message">
          Aguarde um momento enquanto confirmamos sua conta.
        </p>
      </div>

      <div v-else-if="isSuccess" class="verify-card__success">
        <span class="verify-card__tag verify-card__tag--success">SUCESSO</span>
        <h1 class="verify-card__title">E-mail verificado!</h1>
        <p class="verify-card__message">
          Sua conta foi ativada com sucesso. Redirecionando...
        </p>
      </div>

      <div v-else class="verify-card__failure">
        <span class="verify-card__tag verify-card__tag--failure"
          >FALHA NA VERIFICAÇÃO</span
        >
        <h1 class="verify-card__title">Não foi possível verificar o e-mail</h1>
        <p class="verify-card__message">
          O link de verificação pode ter expirado ou ser inválido.
        </p>

        <div
          v-if="resendSuccessMessage"
          role="status"
          class="verify-card__alert verify-card__alert--success"
        >
          {{ resendSuccessMessage }}
        </div>

        <div
          v-if="resendErrorMessage"
          role="alert"
          class="verify-card__alert verify-card__alert--danger"
        >
          {{ resendErrorMessage }}
        </div>

        <div class="verify-card__actions">
          <button
            v-if="session.isAuthenticated"
            type="button"
            class="verify-btn verify-btn--primary"
            :disabled="isResending"
            @click="handleResend"
          >
            {{
              isResending ? "Reenviando..." : "Reenviar e-mail de verificação"
            }}
          </button>

          <RouterLink v-else to="/login" class="verify-btn verify-btn--primary">
            Ir para o login
          </RouterLink>

          <RouterLink to="/" class="verify-btn verify-btn--secondary">
            Página inicial
          </RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useSessionStore } from "@/features/auth/stores/session";
import { isHttpError, isRateLimitedHttpError } from "@/lib/http";
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const isProcessing = ref(false);
const isSuccess = ref(false);
const isResending = ref(false);
const resendSuccessMessage = ref<string | null>(null);
const resendErrorMessage = ref<string | null>(null);
onMounted(async () => {
  if (route.query.ok === "1") {
    isProcessing.value = true;
    try {
      await session.bootstrap(true);
      isSuccess.value = true;
      await router.push({ name: "dashboard" });
    } catch {
      isSuccess.value = true;
      await router.push({ name: "dashboard" });
    } finally {
      isProcessing.value = false;
    }
  }
});
const handleResend = async () => {
  isResending.value = true;
  resendSuccessMessage.value = null;
  resendErrorMessage.value = null;
  try {
    const response = await session.resendVerification();
    resendSuccessMessage.value =
      response.message || "Novo e-mail de verificação enviado com sucesso.";
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
</script>

<style scoped>
.verify-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: var(--color-canvas, #fdfbf7);
  font-family: var(--type-body, inherit);
  color: var(--color-ink, #252b25);
}

.verify-card {
  width: min(100%, 34rem);
  padding: 2.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: white;
  box-shadow: var(--shadow-panel, 0 10px 25px -5px rgb(0 0 0 / 0.05));
  text-align: center;
}

.verify-card__tag {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.verify-card__tag--success {
  background: #dcfce7;
  color: #166534;
}

.verify-card__tag--failure {
  background: #fee2e2;
  color: #991b1b;
}

.verify-card__title {
  margin: 0 0 1rem;
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.verify-card__message {
  margin: 0 0 1.5rem;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.verify-card__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1.25rem;
  text-align: left;
}

.verify-card__alert--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.verify-card__alert--danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.verify-card__actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.verify-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: opacity var(--motion-quick, 150ms) ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.verify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.verify-btn--primary {
  background: var(--color-evergreen, #314830);
  color: white;
}

.verify-btn--secondary {
  background: rgb(58 77 60 / 10%);
  color: var(--color-ink, #252b25);
}
</style>
