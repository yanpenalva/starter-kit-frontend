<template>
  <div class="public-layout">
    <a class="public-layout__skip" href="#main-content"
      >Pular para o conteúdo</a
    >
    <BackButton />
    <slot />
  </div>
</template>

<script setup lang="ts">
import BackButton from "@/shared/components/BackButton.vue";
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  color: var(--color-ink);
  font-family: var(--type-body);
}

.public-layout__skip {
  position: absolute;
  z-index: 2;
  top: 0;
  left: var(--layout-gutter);
  padding: 0.75rem 1rem;
  transform: translateY(-150%);
  border-radius: 0 0 0.5rem 0.5rem;
  background: var(--color-panel);
  color: var(--color-evergreen);
  font-weight: 700;
}

.public-layout__skip:focus-visible {
  transform: translateY(0);
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
</style>
