<template>
  <nav class="app-navigation" aria-label="Navegação principal">
    <div class="app-navigation__container">
      <div class="app-navigation__left">
        <RouterLink
          to="/"
          class="app-navigation__brand"
          aria-label="Starter Kit, início"
        >
          <span class="app-navigation__brand-mark" aria-hidden="true">S</span>
          <span
            >starter<span class="app-navigation__brand-light">kit</span></span
          >
        </RouterLink>

        <ul class="app-navigation__links" role="list">
          <li v-for="item in visibleNavItems" :key="item.key">
            <RouterLink
              :to="item.to"
              class="app-navigation__link"
              :class="{
                'app-navigation__link--active': isRouteActive(item.to),
              }"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="app-navigation__right">
        <template v-if="isAuthenticated">
          <div class="app-navigation__user">
            <span class="app-navigation__user-name">{{ user?.name }}</span>
            <span
              v-if="isLimited"
              class="app-navigation__badge app-navigation__badge--limited"
            >
              Pendente
            </span>
            <span
              v-for="role in roles"
              :key="role"
              class="app-navigation__badge app-navigation__badge--role"
            >
              {{ role }}
            </span>
          </div>

          <button
            type="button"
            class="app-navigation__logout-btn"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            {{ isLoggingOut ? "Saindo..." : "Sair" }}
          </button>
        </template>

        <template v-else>
          <RouterLink to="/login" class="app-navigation__login-link">
            Entrar
          </RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useSessionStore } from "@/features/auth/stores/session";
const { isAuthenticated, isLimited, user, roles, visibleNavItems } =
  useAuthorization();
const session = useSessionStore();
const router = useRouter();
const route = useRoute();
const isLoggingOut = ref(false);
const isRouteActive = (path: string): boolean => {
  if (!route) return false;
  if (path === "/") {
    return route.path === "/";
  }
  return route.path.startsWith(path);
};
const handleLogout = async () => {
  isLoggingOut.value = true;
  try {
    await session.logout();
    if (router) {
      await router.push({ name: "login" });
    }
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<style scoped>
.app-navigation {
  width: 100%;
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  background: var(--color-canvas, #fdfbf7);
  font-family: var(--type-body, inherit);
}

.app-navigation__container {
  display: flex;
  width: min(100%, var(--layout-width, 72rem));
  min-height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem var(--layout-gutter, 1.5rem);
  margin-inline: auto;
  gap: 1rem;
}

.app-navigation__left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.app-navigation__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-ink, #252b25);
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  text-decoration: none;
}

.app-navigation__brand-mark {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 0.5rem;
  background: var(--color-evergreen, #314830);
  color: white;
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
  font-weight: 400;
}

.app-navigation__brand-light {
  color: var(--color-evergreen, #314830);
  font-weight: 400;
}

.app-navigation__links {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.app-navigation__link {
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  color: var(--color-ink, #252b25);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background var(--motion-quick, 150ms) ease;
}

.app-navigation__link:hover {
  background: rgb(49 72 48 / 6%);
}

.app-navigation__link--active {
  background: rgb(49 72 48 / 10%);
  color: var(--color-evergreen, #314830);
  font-weight: 600;
}

.app-navigation__right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-navigation__user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-navigation__user-name {
  color: var(--color-ink, #252b25);
  font-size: 0.875rem;
  font-weight: 500;
}

.app-navigation__badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.app-navigation__badge--role {
  background: rgb(49 72 48 / 10%);
  color: var(--color-evergreen, #314830);
}

.app-navigation__badge--limited {
  background: rgb(217 119 6 / 15%);
  color: #b45309;
}

.app-navigation__logout-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-ink, #252b25);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--motion-quick, 150ms) ease;
}

.app-navigation__logout-btn:hover {
  border-color: var(--color-evergreen, #314830);
  color: var(--color-evergreen, #314830);
}

.app-navigation__login-link {
  padding: 0.375rem 0.875rem;
  border-radius: 0.375rem;
  background: var(--color-evergreen, #314830);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
