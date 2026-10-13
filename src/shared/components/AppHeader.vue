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
    </div>
  </q-header>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  isDesktop: boolean;
  mini: boolean;
  drawerOpen: boolean;
  context?: string;
}>();

const emit = defineEmits<{ toggle: [] }>();

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
