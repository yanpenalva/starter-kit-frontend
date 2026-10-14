<template>
  <div class="auth-layout">
    <a class="auth-layout__skip" href="#auth-content">Pular para o conteúdo</a>

    <header class="auth-layout__header">
      <a class="auth-layout__brand" href="/" aria-label="Starter Kit, início">
        <span class="auth-layout__brand-mark" aria-hidden="true">S</span>
        <span>starter<span class="auth-layout__brand-light">kit</span></span>
      </a>
      <span class="auth-layout__context">UM ESPAÇO PARA SEGUIR</span>
    </header>

    <main
      id="auth-content"
      class="auth-layout__main"
      :aria-labelledby="headingId"
    >
      <section class="auth-layout__intro">
        <p class="auth-layout__eyebrow">{{ eyebrow }}</p>
        <h1 :id="headingId">{{ title }}</h1>
        <InfoTooltip
          text="Se precisar de orientações sobre sua conta, consulte a equipe responsável pelo seu acesso."
          label="Ajuda de acesso à conta"
        />
        <p class="auth-layout__description">{{ description }}</p>
        <span class="auth-layout__ornament" aria-hidden="true">✳</span>
      </section>

      <section class="auth-layout__panel" aria-label="Conteúdo da área">
        <slot />
      </section>
    </main>

    <footer class="auth-layout__footer">
      <slot name="footer">Feito para seguir em frente, no seu tempo.</slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";
import InfoTooltip from "@/shared/components/InfoTooltip.vue";

withDefaults(
  defineProps<{
    title: string;
    description: string;
    eyebrow?: string;
  }>(),
  { eyebrow: "SEU ESPAÇO, NO SEU TEMPO" },
);

const headingId = useId();
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  padding: 1.75rem var(--layout-gutter) 1rem;
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--type-body);
}

.auth-layout__header,
.auth-layout__footer {
  display: flex;
  width: min(100%, var(--layout-width));
  align-items: center;
  justify-content: space-between;
  margin-inline: auto;
}

.auth-layout__header {
  min-height: 54px;
}

.auth-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--color-ink);
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  text-decoration: none;
  transition: color var(--motion-quick) ease;
}

.auth-layout__brand-mark {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.625rem 0.625rem 0.625rem 0.1875rem;
  background: var(--color-evergreen);
  color: white;
  font-family: var(--type-display);
  font-size: 1.25rem;
  font-weight: 400;
}

.auth-layout__brand-light {
  color: var(--color-evergreen);
  font-weight: 400;
}

.auth-layout__context,
.auth-layout__eyebrow {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.auth-layout__context {
  color: var(--color-muted);
}

.auth-layout__main {
  display: grid;
  width: min(100%, 68rem);
  min-height: min(42rem, calc(100svh - 9rem));
  grid-template-columns: 0.95fr 1.05fr;
  overflow: hidden;
  margin: clamp(1.5rem, 5vh, 3.75rem) auto 2rem;
  border: 1px solid rgb(58 77 60 / 9%);
  border-radius: 0.25rem var(--radius-panel) 0.25rem 0.25rem;
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.auth-layout__intro {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding: clamp(2rem, 5vw, 4.5rem);
  background: linear-gradient(
    145deg,
    var(--color-evergreen),
    var(--color-evergreen-deep)
  );
  color: white;
}

.auth-layout__intro::after {
  position: absolute;
  right: -5rem;
  bottom: -7rem;
  width: 18rem;
  height: 18rem;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 50%;
  box-shadow:
    0 0 0 2rem rgb(255 255 255 / 4%),
    0 0 0 4rem rgb(255 255 255 / 3%);
  content: "";
  pointer-events: none;
}

.auth-layout__eyebrow {
  margin: 0 0 1.5rem;
  color: #d7e1d2;
}

.auth-layout__intro h1 {
  max-width: 15ch;
  margin: 0;
  font-family: var(--type-display);
  font-size: clamp(2.75rem, 5vw, 4.75rem);
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 1;
}

.auth-layout__description {
  max-width: 28rem;
  margin: 1.5rem 0 0;
  color: #e0e8dc;
  font-size: 0.9375rem;
  line-height: 1.8;
}

.auth-layout__ornament {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
  color: #c8d8c2;
  font-size: 1.375rem;
}

.auth-layout__panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2rem, 5vw, 4.5rem);
}

.auth-layout__footer {
  min-height: 2.5rem;
  color: var(--color-muted);
  font-size: 0.6875rem;
}

.auth-layout__brand:focus-visible,
.auth-layout__skip:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 5px;
  border-radius: 3px;
}

.auth-layout__skip {
  position: absolute;
  top: 0;
  left: var(--layout-gutter);
  z-index: 2;
  padding: 0.75rem 1rem;
  transform: translateY(-150%);
  border-radius: 0 0 0.5rem 0.5rem;
  background: var(--color-panel);
  color: var(--color-evergreen);
  font-weight: 700;
  transition: transform var(--motion-quick) ease;
}

.auth-layout__skip:focus-visible {
  transform: translateY(0);
}

@media (max-width: 760px) {
  .auth-layout__main {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .auth-layout__intro {
    min-height: 18rem;
    padding: 2.25rem;
  }

  .auth-layout__intro h1 {
    max-width: 18ch;
    font-size: clamp(2.5rem, 11vw, 3.75rem);
  }

  .auth-layout__ornament {
    margin-top: 1.5rem;
  }

  .auth-layout__panel {
    padding: 2.25rem;
  }
}

@media (max-width: 480px) {
  .auth-layout {
    padding-inline: 1rem;
  }

  .auth-layout__context {
    max-width: 9rem;
    text-align: right;
  }

  .auth-layout__intro,
  .auth-layout__panel {
    padding: 1.75rem;
  }

  .auth-layout__footer {
    padding-block: 0.75rem;
    line-height: 1.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-layout__brand,
  .auth-layout__skip {
    transition-duration: 0.01ms;
  }
}
</style>
