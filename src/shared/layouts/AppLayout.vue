<template>
  <div class="app-layout">
    <AppNavigation />
    <main id="app-content" class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavigation from "@/shared/components/AppNavigation.vue";
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-canvas, #fdfbf7);
  color: var(--color-ink, #252b25);
  font-family: var(--type-body, inherit);
}

.app-layout__main {
  width: min(100%, var(--layout-width, 72rem));
  margin-inline: auto;
  padding: 2rem var(--layout-gutter, 1.5rem);
}
</style>
