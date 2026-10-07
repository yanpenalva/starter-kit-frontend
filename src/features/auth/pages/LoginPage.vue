<template>
  <AuthLayout
    title="Acesse sua conta"
    description="Informe seu e-mail e senha para continuar no painel."
    eyebrow="AUTENTICAÇÃO"
  >
    <form class="login-form" @submit.prevent="handleSubmit">
      <div
        v-if="successMessage"
        role="status"
        class="login-form__alert login-form__alert--success"
      >
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" role="alert" class="login-form__alert">
        {{ errorMessage }}
      </div>

      <div class="login-form__field">
        <label for="login-email" class="login-form__label">E-mail</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="login-form__input"
          placeholder="seu@email.com"
        />
      </div>

      <div class="login-form__field">
        <div class="login-form__label-row">
          <label for="login-password" class="login-form__label">Senha</label>
          <RouterLink to="/forgot-password" class="login-form__link">
            Esqueci a senha
          </RouterLink>
        </div>
        <input
          id="login-password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="login-form__input"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        class="login-form__submit-btn"
        :disabled="isLoading"
      >
        <span v-if="isLoading">Entrando...</span>
        <span v-else>Entrar</span>
      </button>

      <div class="login-form__secondary-links">
        <span class="login-form__prompt">Não tem uma conta?</span>
        <RouterLink
          to="/register"
          class="login-form__link login-form__link--strong"
        >
          Criar conta
        </RouterLink>
      </div>

      <div class="login-form__help">
        <RouterLink to="/" class="login-form__link">
          Voltar para a página inicial
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
import { isHttpError } from "@/lib/http";
const email = ref("");
const password = ref("");
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const session = useSessionStore();
const router = useRouter();
const route = useRoute();
const successMessage = computed(() => {
  if (route.query.registered === "1") {
    return "Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta ou faça login.";
  }
  if (route.query.reset === "ok") {
    return "Senha redefinida com sucesso. Faça login com sua nova senha.";
  }
  return null;
});
const isValidRedirect = (redirect: unknown): redirect is string => {
  if (typeof redirect !== "string") return false;
  return (
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    !redirect.startsWith("/\\")
  );
};
const handleSubmit = async () => {
  if (!email.value || !password.value) return;
  isLoading.value = true;
  errorMessage.value = null;
  try {
    await session.login({
      email: email.value,
      password: password.value,
    });
    const redirectTarget = route.query.redirect;
    if (isValidRedirect(redirectTarget)) {
      await router.push(redirectTarget);
    } else {
      await router.push({ name: "dashboard" });
    }
  } catch (error: unknown) {
    if (isHttpError(error)) {
      if (error.kind === "unauthorized") {
        errorMessage.value = "Credenciais inválidas.";
      } else if (error.kind === "forbidden") {
        errorMessage.value = "Esta conta foi desativada.";
      } else if (error.kind === "csrf_mismatch") {
        errorMessage.value = "Sessão expirada. Tente novamente.";
      } else if (error.kind === "validation") {
        errorMessage.value = "Verifique os dados informados.";
      } else if (error.kind === "rate_limited") {
        errorMessage.value =
          "Muitas tentativas. Aguarde antes de tentar novamente.";
      } else {
        errorMessage.value = error.message;
      }
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
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.login-form__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.login-form__alert--success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.login-form__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-form__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink, #252b25);
}

.login-form__input {
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

.login-form__input:focus {
  outline: none;
  border-color: var(--color-evergreen, #314830);
  box-shadow: 0 0 0 3px rgb(49 72 48 / 12%);
}

.login-form__submit-btn {
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

.login-form__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-form__secondary-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.login-form__prompt {
  font-size: 0.8125rem;
  color: var(--color-muted, #666);
}

.login-form__link--strong {
  font-weight: 600;
  color: var(--color-evergreen, #314830);
}

.login-form__help {
  text-align: center;
  margin-top: 0.25rem;
}

.login-form__link {
  color: var(--color-muted, #666);
  font-size: 0.8125rem;
  text-decoration: none;
}

.login-form__link:hover {
  color: var(--color-evergreen, #314830);
}
</style>
