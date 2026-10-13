<template>
  <AppLayout>
    <div class="dashboard-page">
      <header class="dashboard-header">
        <p class="dashboard-eyebrow">INÍCIO</p>
        <h1 class="dashboard-title">Olá, {{ user?.name || "Usuário" }}!</h1>
        <p class="dashboard-subtitle">
          Esta plataforma reúne ferramentas para organizar contas e perfis e
          consultar ações registradas. Os atalhos variam conforme o acesso da
          sua conta.
        </p>
      </header>

      <section class="dashboard-card" aria-labelledby="actions-heading">
        <h2 id="actions-heading" class="dashboard-card__title">
          O que você gostaria de fazer?
        </h2>
        <ul class="dashboard-actions" role="list">
          <li v-for="shortcut in visibleShortcuts" :key="shortcut.name">
            <RouterLink :to="shortcut.path" class="dashboard-action-btn">
              {{ shortcut.label }}
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/profile" class="dashboard-action-btn">
              Minha Conta
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/manual" class="dashboard-action-btn">
              Consultar o Manual
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import AppLayout from "@/shared/layouts/AppLayout.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { shortcutDescriptors } from "@/app/router/descriptors";

const { user, can } = useAuthorization();

const visibleShortcuts = computed(() =>
  shortcutDescriptors.filter((shortcut) =>
    shortcut.permissions.some((permission) => can(permission)),
  ),
);
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-header {
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  padding-bottom: 1.5rem;
}

.dashboard-eyebrow {
  margin: 0 0 0.5rem;
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.dashboard-title {
  margin: 0 0 0.5rem;
  font-family: var(--type-display, inherit);
  font-size: 2.25rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.dashboard-subtitle {
  max-width: 42rem;
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.dashboard-card {
  max-width: 58rem;
  padding: 1.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: var(--color-panel, #fffefb);
  box-shadow: var(--shadow-panel, 0 10px 25px -5px rgb(0 0 0 / 0.05));
}

.dashboard-card__title {
  margin: 0 0 1rem;
  font-family: var(--type-display, inherit);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dashboard-action-btn {
  display: inline-block;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  background: rgb(49 72 48 / 8%);
  color: var(--color-evergreen, #314830);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--motion-quick, 150ms) ease;
}

.dashboard-action-btn:hover {
  background: rgb(49 72 48 / 15%);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-action-btn {
    transition: none;
  }
}
</style>
