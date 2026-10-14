<template>
  <AppLayout>
    <div class="admin-page">
      <BackButton v-if="backFallback" :fallback="backFallback" />
      <header class="page-header">
        <p class="page-eyebrow">{{ eyebrow }}</p>
        <div class="page-title-row">
          <h1 class="page-title">{{ title }}</h1>
          <InfoTooltip
            v-if="helpText"
            :text="helpText"
            :label="`Ajuda: ${title}`"
          />
        </div>
        <p class="page-subtitle"><slot name="subtitle" /></p>
      </header>

      <div v-if="$slots.toolbar" class="page-toolbar">
        <slot name="toolbar" />
      </div>

      <section class="page-card">
        <div v-if="$slots.actions" class="page-actions">
          <slot name="actions" />
        </div>
        <slot />
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/shared/layouts/AppLayout.vue";
import BackButton from "@/shared/components/BackButton.vue";
import InfoTooltip from "@/shared/components/InfoTooltip.vue";

defineProps<{
  eyebrow: string;
  title: string;
  helpText?: string;
  backFallback?: string;
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

.page-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-subtitle {
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
}

.page-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-toolbar > :last-child:not(:first-child) {
  margin-left: auto;
}

.page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.page-card {
  padding: var(--space-panel, 1.5rem);
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: var(--color-panel, #fffefb);
}
</style>
