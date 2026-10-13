<template>
  <q-header class="app-header">
    <div class="app-header__bar">
      <button
        type="button"
        class="app-header__toggle"
        :aria-label="toggleLabel"
        :aria-expanded="isExpanded"
        aria-controls="app-navigation"
        @click="emit('toggle')"
      >
        <span class="material-icons app-header__toggle-icon" aria-hidden="true">
          {{ toggleIcon }}
        </span>
      </button>

      <span class="app-header__brand">
        <span class="app-header__brand-mark" aria-hidden="true">S</span>
        <span class="app-header__brand-name">
          starter<span class="app-header__brand-light">kit</span>
        </span>
      </span>

      <span v-if="context" class="app-header__context">{{ context }}</span>

      <button
        type="button"
        class="app-header__account"
        aria-label="Abrir menu da conta"
        :aria-expanded="accountMenuOpen"
        @click="accountMenuOpen = !accountMenuOpen"
      >
        <span class="app-header__avatar" aria-hidden="true">{{
          initials
        }}</span>
      </button>
      <q-menu v-model="accountMenuOpen" anchor="bottom right" self="top right">
        <div class="app-header__account-menu">
          <strong>{{ user?.name ?? "Conta" }}</strong>
          <span>{{ roles.map(roleLabel).join(", ") || "Sem perfil" }}</span>
          <button type="button" :disabled="isLoggingOut" @click="handleLogout">
            {{ isLoggingOut ? "Saindo..." : "Sair" }}
          </button>
          <p v-if="logoutError" role="alert">{{ logoutError }}</p>
        </div>
      </q-menu>
    </div>
  </q-header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useSessionStore } from "@/features/auth/stores/session";
import { roleLabel } from "@/shared/utils/role-labels";

const props = defineProps<{
  isDesktop: boolean;
  mini: boolean;
  drawerOpen: boolean;
  context?: string;
}>();

const emit = defineEmits<{ toggle: [] }>();
const { user, roles } = useAuthorization();
const session = useSessionStore();
const router = useRouter();
const accountMenuOpen = ref(false);
const isLoggingOut = ref(false);
const logoutError = ref<string | null>(null);
const initials = computed(() => {
  const names = (user.value?.name ?? "").trim().split(/\s+/).filter(Boolean);
  return names.length > 1
    ? `${names[0]?.[0] ?? ""}${names[1]?.[0] ?? ""}`.toUpperCase()
    : (names[0]?.slice(0, 2).toUpperCase() ?? "?");
});

const handleLogout = async (): Promise<void> => {
  isLoggingOut.value = true;
  logoutError.value = null;
  try {
    await session.logout();
  } catch {
    logoutError.value = "Não foi possível concluir a solicitação de saída.";
  } finally {
    await router.push({ name: "login" });
    isLoggingOut.value = false;
  }
};

const isExpanded = computed(() =>
  props.isDesktop ? !props.mini : props.drawerOpen,
);

const toggleIcon = computed(() => {
  if (!props.isDesktop) {
    return props.drawerOpen ? "close" : "menu";
  }
  return props.mini ? "menu" : "menu_open";
});

const toggleLabel = computed(() => {
  if (!props.isDesktop) {
    return props.drawerOpen
      ? "Fechar menu de navegação"
      : "Abrir menu de navegação";
  }
  return props.mini
    ? "Expandir menu de navegação"
    : "Recolher menu de navegação";
});
</script>

<style scoped>
.app-header__bar {
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  background: var(--color-panel, #fffefb);
  font-family: var(--type-body, inherit);
}

.app-header__toggle {
  display: inline-grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-ink, #252a25);
  cursor: pointer;
  place-items: center;
  transition:
    border-color var(--motion-quick, 180ms) ease,
    color var(--motion-quick, 180ms) ease;
}

.app-header__toggle:hover,
.app-header__toggle:focus-visible {
  border-color: var(--color-evergreen, #456b56);
  color: var(--color-evergreen, #456b56);
}

.app-header__toggle-icon {
  font-size: 1.25rem;
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-ink, #252a25);
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.05em;
}

.app-header__brand-mark {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 0.5rem;
  background: var(--color-evergreen, #456b56);
  color: white;
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
  font-weight: 400;
}

.app-header__brand-light {
  color: var(--color-evergreen, #456b56);
  font-weight: 400;
}

.app-header__context {
  min-width: 0;
  overflow: hidden;
  color: var(--color-evergreen, #456b56);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.app-header__account {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  margin-left: auto;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  place-items: center;
}

.app-header__avatar {
  display: grid;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 50%;
  background: rgb(69 107 86 / 12%);
  color: var(--color-evergreen);
  font-size: 0.75rem;
  font-weight: 700;
  place-items: center;
}

.app-header__account-menu {
  display: grid;
  min-width: 12rem;
  gap: 0.5rem;
  padding: 1rem;
}

.app-header__account-menu > span,
.app-header__account-menu p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.app-header__account-menu button {
  justify-self: start;
}

@media (max-width: 1023.98px) {
  .app-header__brand-name {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-header__toggle {
    transition: none;
  }
}
</style>
