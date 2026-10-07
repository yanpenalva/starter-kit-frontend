<template>
  <AppLayout>
    <div class="admin-page">
      <header class="page-header">
        <p class="page-eyebrow">{{ eyebrow }}</p>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle"><slot name="subtitle" /></p>
      </header>
      <section class="page-card"><slot /></section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/shared/layouts/AppLayout.vue";

defineProps<{
  eyebrow: string;
  title: string;
}>();
</script>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  padding-bottom: 1rem;
}

.page-eyebrow {
  margin: 0 0 0.5rem;
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.page-title {
  margin: 0 0 0.5rem;
  color: var(--color-ink, #252b25);
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
}

.page-subtitle {
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
}

.page-card {
  padding: 1.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: white;
}
</style>
