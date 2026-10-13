<template>
  <AppLayout>
    <div class="dashboard-page">
      <header class="dashboard-header">
        <p class="dashboard-eyebrow">PAINEL DE CONTROLE</p>
        <h1 class="dashboard-title">Olá, {{ user?.name || "Usuário" }}!</h1>
        <p class="dashboard-subtitle">Sua sessão está ativa e autenticada.</p>
      </header>

      <div class="dashboard-grid">
        <section class="dashboard-card" aria-labelledby="profile-heading">
          <h2 id="profile-heading" class="dashboard-card__title">
            Perfil da Conta
          </h2>
          <dl class="dashboard-card__list">
            <div class="dashboard-card__item">
              <dt>E-mail</dt>
              <dd>{{ user?.email }}</dd>
            </div>
            <div class="dashboard-card__item">
              <dt>Status de Verificação</dt>
              <dd>
                <span
                  class="dashboard-pill"
                  :class="
                    isLimited
                      ? 'dashboard-pill--warning'
                      : 'dashboard-pill--success'
                  "
                >
                  {{ isLimited ? "Pendente" : "Verificado" }}
                </span>
              </dd>
            </div>
            <div class="dashboard-card__item">
              <dt>Papéis atribuídos</dt>
              <dd>
                <span v-if="roles.length === 0" class="dashboard-card__empty"
                  >Nenhum</span
                >
                <span v-for="role in roles" :key="role" class="dashboard-pill">
                  {{ role }}
                </span>
              </dd>
            </div>
            <div class="dashboard-card__item">
              <dt>Permissões ativas</dt>
              <dd>
                <span
                  v-if="permissions.length === 0"
                  class="dashboard-card__empty"
                  >Nenhuma</span
                >
                <span
                  v-for="perm in permissions"
                  :key="perm"
                  class="dashboard-pill"
                >
                  {{ perm }}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section class="dashboard-card" aria-labelledby="actions-heading">
          <h2 id="actions-heading" class="dashboard-card__title">
            Ações e Atalhos
          </h2>
          <p class="dashboard-card__desc">
            Acesso liberado de acordo com seu perfil:
          </p>
          <ul class="dashboard-actions" role="list">
            <li v-for="shortcut in visibleShortcuts" :key="shortcut.name">
              <RouterLink :to="shortcut.path" class="dashboard-action-btn">
                {{ shortcut.label }}
              </RouterLink>
            </li>
          </ul>
          <p v-if="visibleShortcuts.length === 0" class="dashboard-card__empty">
            Nenhum atalho administrativo adicional configurado para seu perfil.
          </p>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import AppLayout from "@/shared/layouts/AppLayout.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { shortcutDescriptors } from "@/app/router/descriptors";

const { user, isLimited, roles, permissions, can } = useAuthorization();

const visibleShortcuts = computed(() =>
  shortcutDescriptors.filter(
    (shortcut) =>
      shortcut.permissions.length === 0 ||
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
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
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

.dashboard-card__desc {
  margin: 0 0 1rem;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
}

.dashboard-card__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
}

.dashboard-card__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-card__item dt {
  color: var(--color-muted, #666);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dashboard-card__item dd {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.9375rem;
  color: var(--color-ink, #252b25);
}

.dashboard-pill {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: rgb(58 77 60 / 10%);
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 600;
}

.dashboard-pill--success {
  background: #ecfdf5;
  color: #065f46;
}

.dashboard-pill--warning {
  background: #fef3c7;
  color: #b45309;
}

.dashboard-card__empty {
  color: var(--color-muted, #888);
  font-style: italic;
  font-size: 0.875rem;
}

.dashboard-actions {
  display: flex;
  flex-direction: column;
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
