<template>
  <AppLayout>
    <div class="roles-page">
      <header class="page-header">
        <p class="page-eyebrow">ADMINISTRAÇÃO</p>
        <h1 class="page-title">Gerenciamento de Papéis</h1>
        <p class="page-subtitle">
          Área restrita para usuários com papel <code>admin</code>.
        </p>
      </header>

      <section class="page-card">
        <p>Esta área está protegida pela guarda de navegação de papéis.</p>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/shared/layouts/AppLayout.vue";
</script>

<style scoped>
.roles-page {
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
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
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
