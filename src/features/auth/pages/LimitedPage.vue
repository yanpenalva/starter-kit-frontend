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

      <div class="limited-card__actions">
        <button
          type="button"
          class="limited-btn limited-btn--primary"
          :disabled="isChecking"
          @click="checkStatus"
        >
          {{ isChecking ? "Verificando..." : "Já confirmei meu e-mail" }}
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

const session = useSessionStore();
const router = useRouter();

const user = computed(() => session.user);
const isChecking = ref(false);

async function checkStatus() {
  isChecking.value = true;
  try {
    const updated = await session.bootstrap(true);
    if (updated && updated.email_verified_at !== null) {
      await router.push({ name: "dashboard" });
    }
  } finally {
    isChecking.value = false;
  }
}

async function handleLogout() {
  await session.logout();
  await router.push({ name: "login" });
}
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

.limited-btn--primary {
  background: var(--color-evergreen, #314830);
  color: white;
}

.limited-btn--secondary {
  background: rgb(58 77 60 / 10%);
  color: var(--color-ink, #252b25);
}
</style>
