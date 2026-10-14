<template>
  <q-layout view="hHh lpR fFf" class="app-layout">
    <AppHeader
      :is-desktop="isDesktop"
      :mini="mini"
      :drawer-open="mobileOpen"
      :context="contextLabel"
      @toggle="toggleNavigation"
    />

    <q-drawer
      class="app-layout__drawer"
      :model-value="drawerVisible"
      :mini="mini"
      :width="240"
      :mini-width="72"
      :breakpoint="BREAKPOINT"
      :behavior="isDesktop ? 'desktop' : 'mobile'"
      bordered
      @update:model-value="handleDrawerUpdate"
    >
      <AppNavigation :mini="mini && isDesktop" />
    </q-drawer>

    <q-page-container>
      <main id="app-content" class="app-layout__main">
        <slot />
      </main>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/shared/components/AppHeader.vue";
import AppNavigation from "@/shared/components/AppNavigation.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";

const BREAKPOINT = 1024;

const route = useRoute();
const { visibleNavItems } = useAuthorization();

const viewportWidth = ref(
  typeof window === "undefined" ? BREAKPOINT : window.innerWidth,
);
const isDesktop = computed(() => viewportWidth.value >= BREAKPOINT);
const mini = ref(false);
const mobileOpen = ref(false);
const drawerVisible = computed(() => isDesktop.value || mobileOpen.value);

const syncViewport = (): void => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => window.addEventListener("resize", syncViewport));
onUnmounted(() => window.removeEventListener("resize", syncViewport));

watch(isDesktop, (desktop) => {
  if (!desktop) {
    mobileOpen.value = false;
  }
});

const toggleNavigation = (): void => {
  if (isDesktop.value) {
    mini.value = !mini.value;
    return;
  }
  mobileOpen.value = !mobileOpen.value;
};

const handleDrawerUpdate = (value: boolean): void => {
  if (!isDesktop.value) {
    mobileOpen.value = value;
  }
};

const contextLabel = computed(() => {
  const path = route ? route.path : "/";
  const active = visibleNavItems.value.find(
    (item) =>
      item.to !== "/" && (path === item.to || path.startsWith(`${item.to}/`)),
  );
  return active ? active.label : "";
});
</script>

<style scoped>
.app-layout {
  background: var(--color-canvas, #f4f2ec);
  color: var(--color-ink, #252a25);
  font-family: var(--type-body, inherit);
  overflow-x: clip;
}

.app-layout :deep(.q-drawer) {
  background: var(--color-panel, #fffefb);
}

.app-layout__main {
  width: min(100%, var(--layout-width, 72rem));
  padding: 2rem var(--layout-gutter, 1.5rem);
  margin-inline: auto;
}
</style>
