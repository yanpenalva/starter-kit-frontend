<template>
  <div class="verify-page">
    <main id="verify-content" class="verify-card" role="main">
      <div v-if="showProcessing" class="verify-card__loading">
        <span class="verify-card__tag">VERIFICAÇÃO</span>
        <h1 class="verify-card__title">Verificando seu e-mail...</h1>
        <p class="verify-card__message">
          Aguarde um momento enquanto confirmamos sua conta.
        </p>
      </div>

      <div v-if="showSuccess" class="verify-card__success">
        <span class="verify-card__tag verify-card__tag--success">SUCESSO</span>
        <h1 class="verify-card__title">E-mail verificado!</h1>
        <p class="verify-card__message">
          Sua conta foi verificada com sucesso. Redirecionando...
        </p>
      </div>

      <div v-if="showAwaitingApproval" class="verify-card__awaiting">
        <span class="verify-card__tag verify-card__tag--success">SUCESSO</span>
        <h1 class="verify-card__title">E-mail verificado!</h1>
        <p class="verify-card__message">
          Seu e-mail foi confirmado e sua conta está aguardando aprovação para
          liberar o acesso.
        </p>
      </div>

      <div v-if="showAccountUnavailable" class="verify-card__unavailable">
        <span class="verify-card__tag verify-card__tag--failure"
          >CONTA INDISPONÍVEL</span
        >
        <h1 class="verify-card__title">Conta indisponível</h1>
        <p class="verify-card__message">
          Sua conta está indisponível no momento. Entre em contato com o suporte
          para mais informações.
        </p>

        <div class="verify-card__actions">
          <RouterLink to="/login" class="verify-btn verify-btn--primary">
            Ir para o login
          </RouterLink>

          <RouterLink to="/" class="verify-btn verify-btn--secondary">
            Página inicial
          </RouterLink>
        </div>
      </div>

      <div v-if="showLoginHint" class="verify-card__confirmed">
        <span class="verify-card__tag verify-card__tag--success"
          >CONFIRMADO</span
        >
        <h1 class="verify-card__title">E-mail confirmado!</h1>
        <p class="verify-card__message">
          Seu e-mail foi confirmado. Faça login para continuar.
        </p>

        <div class="verify-card__actions">
          <RouterLink to="/login" class="verify-btn verify-btn--primary">
            Ir para o login
          </RouterLink>

          <RouterLink to="/" class="verify-btn verify-btn--secondary">
            Página inicial
          </RouterLink>
        </div>
      </div>

      <div v-if="showFailure" class="verify-card__failure">
        <span class="verify-card__tag verify-card__tag--failure"
          >FALHA NA VERIFICAÇÃO</span
        >
        <h1 class="verify-card__title">Não foi possível verificar o e-mail</h1>
        <p class="verify-card__message">
          {{
            verifyErrorMessage ??
            "O link de verificação pode ter expirado ou ser inválido."
          }}
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

          <RouterLink
            v-if="!session.isAuthenticated"
            to="/login"
            class="verify-btn verify-btn--primary"
          >
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
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useSessionStore } from "@/features/auth/stores/session";
import { isHttpError, isRateLimitedHttpError } from "@/lib/http";
import {
  signedLinkErrorMessage,
  signedLinkFromQuery,
} from "@/features/auth/utils/verify-email-link";
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const isProcessing = ref(false);
const isSuccess = ref(false);
const isAwaitingApproval = ref(false);
const isAccountUnavailable = ref(false);
const isLoginHint = ref(false);
const isResending = ref(false);
const verifyErrorMessage = ref<string | null>(null);
const emailConfirmed = ref(false);
const serverConfirmed = ref(false);
const resendSuccessMessage = ref<string | null>(null);
const resendErrorMessage = ref<string | null>(null);
const showProcessing = computed(() => isProcessing.value);
const showSuccess = computed(() => !isProcessing.value && isSuccess.value);
const showAwaitingApproval = computed(
  () => !isProcessing.value && !isSuccess.value && isAwaitingApproval.value,
);
const showAccountUnavailable = computed(
  () =>
    !isProcessing.value &&
    !isSuccess.value &&
    !isAwaitingApproval.value &&
    isAccountUnavailable.value,
);
const showLoginHint = computed(
  () =>
    !isProcessing.value &&
    !isSuccess.value &&
    !isAwaitingApproval.value &&
    !isAccountUnavailable.value &&
    isLoginHint.value,
);
const showFailure = computed(
  () =>
    !isProcessing.value &&
    !isSuccess.value &&
    !isAwaitingApproval.value &&
    !isAccountUnavailable.value &&
    !isLoginHint.value,
);
const resolveRateLimitMessage = (retryAfterSeconds: number | null): string => {
  if (retryAfterSeconds !== null)
    return `Muitas tentativas. Tente novamente em ${retryAfterSeconds} segundos.`;
  return "Muitas tentativas. Aguarde antes de tentar novamente.";
};
const resetVerifyState = (): void => {
  isProcessing.value = false;
  isSuccess.value = false;
  isAwaitingApproval.value = false;
  isAccountUnavailable.value = false;
  isLoginHint.value = false;
  verifyErrorMessage.value = null;
  emailConfirmed.value = false;
  serverConfirmed.value = false;
  resendSuccessMessage.value = null;
  resendErrorMessage.value = null;
};
const applyEmptyProfileState = (): void => {
  if (emailConfirmed.value && session.status === "blocked") {
    if (session.isPendingApproval) {
      isAwaitingApproval.value = true;
      return;
    }
    isAccountUnavailable.value = true;
    return;
  }
  if (
    serverConfirmed.value &&
    (session.status === "unauthenticated" || session.status === "idle")
  ) {
    isLoginHint.value = true;
    return;
  }
  if (emailConfirmed.value && !serverConfirmed.value) {
    verifyErrorMessage.value =
      "Não foi possível confirmar a verificação deste e-mail. Entre na sua conta para conferir a situação ou peça um novo e-mail de verificação.";
  }
};
const confirmViaSession = async (): Promise<void> => {
  isProcessing.value = true;
  isAwaitingApproval.value = false;
  isAccountUnavailable.value = false;
  isSuccess.value = false;
  isLoginHint.value = false;
  verifyErrorMessage.value = null;
  try {
    const profile = await session.bootstrap(true);
    if (profile === null) {
      applyEmptyProfileState();
      return;
    }
    if (profile.email_verified_at !== null) {
      emailConfirmed.value = true;
      isSuccess.value = true;
      try {
        await router.push({ name: "dashboard" });
      } catch {
        isSuccess.value = true;
      }
      return;
    }
    emailConfirmed.value = false;
    verifyErrorMessage.value =
      "Não foi possível confirmar a verificação deste e-mail. Peça um novo e-mail de verificação e tente novamente.";
  } catch {
    applyEmptyProfileState();
  } finally {
    isProcessing.value = false;
  }
};
const runVerification = async (): Promise<void> => {
  resetVerifyState();
  const link = signedLinkFromQuery(route.query);
  if (link !== null) {
    isProcessing.value = true;
    try {
      await session.confirmEmail(link);
    } catch (error: unknown) {
      verifyErrorMessage.value = signedLinkErrorMessage(error);
      isProcessing.value = false;
      return;
    }
    emailConfirmed.value = true;
    serverConfirmed.value = true;
    await confirmViaSession();
    return;
  }
  if (route.query.ok === "1") {
    emailConfirmed.value = true;
    await confirmViaSession();
  }
};
onMounted(() => {
  void runVerification();
});
watch(
  () => route.query,
  () => {
    void runVerification();
  },
);
const handleResend = async () => {
  if (isResending.value) return;
  isResending.value = true;
  resendSuccessMessage.value = null;
  resendErrorMessage.value = null;
  try {
    const response = await session.resendVerification();
    resendSuccessMessage.value =
      response.message || "Novo e-mail de verificação enviado com sucesso.";
  } catch (error: unknown) {
    if (isRateLimitedHttpError(error)) {
      resendErrorMessage.value = resolveRateLimitMessage(
        error.retryAfterSeconds,
      );
      return;
    }
    if (isHttpError(error)) {
      resendErrorMessage.value = error.message;
      return;
    }
    resendErrorMessage.value =
      "Não foi possível conectar ao serviço. Verifique sua conexão.";
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
