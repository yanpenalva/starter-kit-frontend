<template>
  <div class="forbidden-page">
    <main id="forbidden-content" class="forbidden-card" role="main">
      <span class="forbidden-card__tag">ERRO 403</span>
      <h1 class="forbidden-card__title">{{ title }}</h1>
      <p class="forbidden-card__message">{{ message }}</p>

      <div class="forbidden-card__actions">
        <template v-if="isBlocked">
          <button
            type="button"
            class="forbidden-btn forbidden-btn--danger"
            @click="handleLogout"
          >
            Encerrar sessão
          </button>
        </template>
        <template v-else>
          <RouterLink
            to="/dashboard"
            class="forbidden-btn forbidden-btn--primary"
          >
            Ir para o Painel
          </RouterLink>
          <RouterLink to="/" class="forbidden-btn forbidden-btn--secondary">
            Página inicial
          </RouterLink>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useSessionStore } from "../stores/session";
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const isBlocked = computed(() => {
  return session.isBlocked || route.query.reason === "blocked";
});
const title = computed(() => {
  return isBlocked.value ? "Conta Desativada" : "Acesso Negado";
});
const message = computed(() => {
  if (isBlocked.value) {
    return "Esta conta foi desativada. Entre em contato com o suporte caso acredite que isto seja um engano.";
  }
  return "Você não tem permissão para realizar esta ação ou acessar esta página.";
});
const handleLogout = async () => {
  await session.logout();
  await router.push({ name: "login" });
};
</script>

<style scoped>
.forbidden-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: var(--color-canvas, #fdfbf7);
  font-family: var(--type-body, inherit);
  color: var(--color-ink, #252b25);
}

.forbidden-card {
  width: min(100%, 32rem);
  padding: 2.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: white;
  box-shadow: var(--shadow-panel, 0 10px 25px -5px rgb(0 0 0 / 0.05));
  text-align: center;
}

.forbidden-card__tag {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.forbidden-card__title {
  margin: 0 0 1rem;
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.forbidden-card__message {
  margin: 0 0 2rem;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.forbidden-card__actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.forbidden-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: opacity var(--motion-quick, 150ms) ease;
}

.forbidden-btn--primary {
  background: var(--color-evergreen, #314830);
  color: white;
}

.forbidden-btn--secondary {
  background: rgb(58 77 60 / 10%);
  color: var(--color-ink, #252b25);
}

.forbidden-btn--danger {
  background: #dc2626;
  color: white;
}
</style>
