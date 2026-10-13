<template>
  <AppLayout>
    <article class="manual">
      <header class="manual__header">
        <p class="manual__eyebrow">AJUDA</p>
        <h1 class="manual__title">Manual de uso</h1>
        <InfoTooltip
          text="Encontre orientações para acessar sua conta e usar os recursos disponíveis."
          label="Ajuda sobre o Manual de uso"
        />
        <p class="manual__lead">
          Guia rápido para acessar sua conta, encontrar as ferramentas
          disponíveis e entender as proteções da plataforma.
        </p>
      </header>

      <nav class="manual__toc" aria-label="Seções do manual">
        <h2 class="manual__toc-title">Nesta página</h2>
        <ul class="manual__toc-list">
          <li v-for="section in MANUAL_SECTIONS" :key="section.id">
            <a :href="`#${section.id}`">{{ section.title }}</a>
          </li>
          <li><a href="#perguntas-frequentes">Perguntas frequentes</a></li>
        </ul>
      </nav>

      <section
        v-for="section in MANUAL_SECTIONS"
        :id="section.id"
        :key="section.id"
        class="manual__section"
      >
        <q-expansion-item
          group="manual"
          expand-separator
          :label="section.title"
          :caption="section.summary"
          header-class="manual__expansion-header"
        >
          <q-card flat>
            <q-card-section class="manual__expansion-content">
              <ul class="manual__steps">
                <li v-for="item in section.items" :key="item">{{ item }}</li>
              </ul>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </section>

      <section
        id="perguntas-frequentes"
        class="manual__section"
        aria-labelledby="duvidas-title"
      >
        <h2 id="duvidas-title" class="manual__section-title">
          Perguntas frequentes
        </h2>
        <q-expansion-item
          v-for="faq in MANUAL_FAQ"
          :key="faq.question"
          group="manual"
          expand-separator
          :label="faq.question"
          header-class="manual__expansion-header manual__faq-header"
        >
          <q-card flat>
            <q-card-section class="manual__faq-answer">
              {{ faq.answer }}
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </section>
    </article>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/shared/layouts/AppLayout.vue";
import InfoTooltip from "@/shared/components/InfoTooltip.vue";
import {
  MANUAL_FAQ,
  MANUAL_SECTIONS,
} from "@/features/manual/data/manual-content";
</script>

<style scoped>
.manual {
  display: flex;
  max-width: 54rem;
  flex-direction: column;
  gap: 1.5rem;
}

.manual__header {
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  padding-bottom: 1rem;
}

.manual__eyebrow {
  margin: 0 0 0.5rem;
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.manual__title {
  margin: 0 0 0.5rem;
  color: var(--color-ink, #252b25);
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
}

.manual__lead {
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.manual__toc {
  padding: 1rem 1.25rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: rgb(49 72 48 / 4%);
}

.manual__toc-title {
  margin: 0 0 0.5rem;
  color: var(--color-evergreen, #314830);
  font-size: 0.875rem;
  font-weight: 700;
}

.manual__toc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.manual__toc-list a {
  color: var(--color-evergreen, #314830);
  font-size: 0.875rem;
}

.manual__section {
  scroll-margin-top: 4.5rem;
}

.manual__section-title {
  margin: 0 0 0.5rem;
  padding: 0.25rem 0;
  color: var(--color-ink, #252b25);
  font-size: 1.25rem;
  font-weight: 600;
}

.manual__expansion-content {
  padding-top: 0;
}

.manual__steps {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
  line-height: 1.6;
}

.manual__faq-answer {
  color: var(--color-muted, #666);
  font-size: 0.875rem;
  line-height: 1.6;
}

:deep(.manual__expansion-header .q-item__label) {
  color: var(--color-ink, #252b25);
  font-weight: 600;
}

:deep(.manual__expansion-header .q-item__label--caption) {
  color: var(--color-muted, #626b61);
  line-height: 1.5;
}
</style>
