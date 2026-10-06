<template>
  <div class="not-found-page">
    <main id="not-found-content" class="not-found-card" role="main">
      <span class="not-found-card__tag">ERRO 404</span>
      <h1 class="not-found-card__title">Página Não Encontrada</h1>
      <p class="not-found-card__message">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>

      <div class="not-found-card__actions">
        <RouterLink to="/" class="not-found-btn not-found-btn--primary">
          Ir para a Página Inicial
        </RouterLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<style scoped>
.not-found-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: var(--color-canvas, #fdfbf7);
  font-family: var(--type-body, inherit);
  color: var(--color-ink, #252b25);
}

.not-found-card {
  width: min(100%, 32rem);
  padding: 2.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: white;
  box-shadow: var(--shadow-panel, 0 10px 25px -5px rgb(0 0 0 / 0.05));
  text-align: center;
}

.not-found-card__tag {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: rgb(58 77 60 / 10%);
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.not-found-card__title {
  margin: 0 0 1rem;
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-ink, #252b25);
}

.not-found-card__message {
  margin: 0 0 2rem;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.not-found-card__actions {
  display: flex;
  justify-content: center;
}

.not-found-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: opacity var(--motion-quick, 150ms) ease;
}

.not-found-btn--primary {
  background: var(--color-evergreen, #314830);
  color: white;
}
</style>
