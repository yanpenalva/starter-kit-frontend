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
    <div v-if="!isAuthenticated" class="app-navigation__footer">
      <RouterLink to="/login" class="app-navigation__login-link">
        Entrar
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";

withDefaults(defineProps<{ mini?: boolean }>(), { mini: false });

const NAV_ICONS: Readonly<Record<string, string>> = {
  dashboard: "home",
  sessions: "devices",
  profile: "account_circle",
  users: "group",
  roles: "badge",
  logs: "history",
  manual: "menu_book",
  limited: "hourglass_empty",
};
const { isAuthenticated, visibleNavItems } = useAuthorization();
const route = useRoute();
const navIcon = (key: string): string => NAV_ICONS[key] ?? "circle";
const isRouteActive = (path: string): boolean => {
  if (!route) return false;
  if (path === "/") return route.path === "/";
  return route.path === path || route.path.startsWith(`${path}/`);
};
</script>

<style scoped>
.app-navigation {
  display: flex;
  height: 100%;
  flex-direction: column;
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
  padding-top: 0.75rem;
  margin-top: auto;
  border-top: 1px solid rgb(58 77 60 / 10%);
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

.app-navigation__link--mini .app-navigation__label {
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

@media (prefers-reduced-motion: reduce) {
  .app-navigation__link {
    transition: none;
  }
}
</style>
