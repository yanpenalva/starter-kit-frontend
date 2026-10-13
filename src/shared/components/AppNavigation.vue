<template>
  <nav
    id="app-navigation"
    class="app-navigation"
    aria-label="Navegação principal"
  >
    <ul class="app-navigation__links" role="list">
      <li v-for="item in visibleNavItems" :key="item.key">
        <RouterLink
          :to="item.to"
          class="app-navigation__link"
          :class="{
            'app-navigation__link--active': isRouteActive(item.to),
            'app-navigation__link--mini': mini,
          }"
          :title="mini ? item.label : undefined"
        >
          <span class="material-icons app-navigation__icon" aria-hidden="true">
            {{ navIcon(item.key) }}
          </span>
          <span class="app-navigation__label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="app-navigation__footer">
      <template v-if="isAuthenticated">
        <div
          class="app-navigation__user"
          :class="{ 'app-navigation__user--mini': mini }"
        >
          <span class="app-navigation__avatar" aria-hidden="true">
            {{ userInitials }}
          </span>
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
          :class="{ 'app-navigation__logout-btn--mini': mini }"
          :disabled="isLoggingOut"
          @click="handleLogout"
        >
          <span
            class="material-icons app-navigation__logout-icon"
            aria-hidden="true"
          >
            logout
          </span>
          <span class="app-navigation__logout-label">
            {{ isLoggingOut ? "Saindo..." : "Sair" }}
          </span>
        </button>
      </template>

      <template v-else>
        <RouterLink to="/login" class="app-navigation__login-link">
          Entrar
        </RouterLink>
      </template>

      <p v-if="logoutError" class="app-navigation__error" role="alert">
        {{ logoutError }}
      </p>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useSessionStore } from "@/features/auth/stores/session";

withDefaults(
  defineProps<{
    mini?: boolean;
  }>(),
  { mini: false },
);

const NAV_ICONS: Readonly<Record<string, string>> = {
  home: "home",
  dashboard: "dashboard",
  users: "group",
  roles: "badge",
  logs: "history",
  manual: "menu_book",
  limited: "hourglass_empty",
};

const { isAuthenticated, isLimited, user, roles, visibleNavItems } =
  useAuthorization();
const session = useSessionStore();
const router = useRouter();
const route = useRoute();
const isLoggingOut = ref(false);
const logoutError = ref<string | null>(null);

const navIcon = (key: string): string => NAV_ICONS[key] ?? "circle";

const userInitials = computed(() => {
  const parts = (user.value?.name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (first === undefined) {
    return "";
  }
  const second = parts[1];
  if (second !== undefined) {
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
});

const isRouteActive = (path: string): boolean => {
  if (!route) return false;
  if (path === "/") {
    return route.path === "/";
  }
  return route.path === path || route.path.startsWith(`${path}/`);
};

const handleLogout = async () => {
  isLoggingOut.value = true;
  logoutError.value = null;
  try {
    await session.logout();
  } catch {
    logoutError.value = "Não foi possível concluir a solicitação de saída.";
  } finally {
    if (router) {
      await router.push({ name: "login" });
    }
    isLoggingOut.value = false;
  }
};
</script>

<style scoped>
.app-navigation {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem 0.75rem;
  background: var(--color-panel, #fffefb);
  font-family: var(--type-body, inherit);
}

.app-navigation__links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.app-navigation__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  color: var(--color-ink, #252a25);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background var(--motion-quick, 180ms) ease;
}

.app-navigation__link:hover {
  background: rgb(49 72 48 / 6%);
}

.app-navigation__link--active {
  background: rgb(69 107 86 / 12%);
  color: var(--color-evergreen, #456b56);
  font-weight: 600;
}

.app-navigation__link--mini {
  justify-content: center;
}

.app-navigation__icon {
  font-size: 1.25rem;
}

.app-navigation__footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  margin-top: auto;
  border-top: 1px solid rgb(58 77 60 / 10%);
}

.app-navigation__user {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.app-navigation__user--mini {
  justify-content: center;
}

.app-navigation__avatar {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 50%;
  background: rgb(69 107 86 / 12%);
  color: var(--color-evergreen, #456b56);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-navigation__user-name {
  color: var(--color-ink, #252a25);
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
  color: var(--color-evergreen, #456b56);
}

.app-navigation__badge--limited {
  background: rgb(217 119 6 / 15%);
  color: #b45309;
}

.app-navigation__logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-ink, #252a25);
  font-size: 0.8125rem;
  cursor: pointer;
  transition:
    border-color var(--motion-quick, 180ms) ease,
    color var(--motion-quick, 180ms) ease;
}

.app-navigation__logout-btn:hover:enabled {
  border-color: var(--color-evergreen, #456b56);
  color: var(--color-evergreen, #456b56);
}

.app-navigation__logout-btn:disabled {
  cursor: progress;
  opacity: 0.6;
}

.app-navigation__logout-btn--mini {
  justify-content: center;
}

.app-navigation__logout-icon {
  font-size: 1.125rem;
}

.app-navigation__login-link {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 0.375rem;
  background: var(--color-evergreen, #456b56);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
}

.app-navigation__error {
  margin: 0;
  color: #b42318;
  font-size: 0.8125rem;
}

@media (prefers-reduced-motion: reduce) {
  .app-navigation__link,
  .app-navigation__logout-btn {
    transition: none;
  }
}

/* Mini-state hides the text visually, keeping it available to assistive
   technology and to the focus order. */
.app-navigation__link--mini .app-navigation__label,
.app-navigation__user--mini .app-navigation__user-name,
.app-navigation__user--mini .app-navigation__badge,
.app-navigation__logout-btn--mini .app-navigation__logout-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
