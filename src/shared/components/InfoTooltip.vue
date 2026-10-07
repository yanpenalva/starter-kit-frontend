<template>
  <span class="info-tooltip">
    <button
      type="button"
      class="info-tooltip__trigger"
      :aria-label="label"
      :aria-describedby="isOpen ? tooltipId : undefined"
      :aria-expanded="isOpen"
      @click="toggle"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
      @keydown.esc="hide"
    >
      <span aria-hidden="true">?</span>
    </button>
    <span
      v-if="isOpen"
      :id="tooltipId"
      class="info-tooltip__bubble"
      role="tooltip"
    >
      <span class="info-tooltip__text">{{ text }}</span>
      <RouterLink v-if="to" :to="to" class="info-tooltip__link">
        {{ linkLabel }}
      </RouterLink>
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, useId } from "vue";
import { RouterLink } from "vue-router";

withDefaults(
  defineProps<{
    text: string;
    label: string;
    to?: string;
    linkLabel?: string;
  }>(),
  { to: undefined, linkLabel: "Ver no manual" },
);

const isOpen = ref(false);
const tooltipId = `info-tooltip-${useId()}`;

const show = (): void => {
  isOpen.value = true;
};

const hide = (): void => {
  isOpen.value = false;
};

const toggle = (): void => {
  isOpen.value = !isOpen.value;
};
</script>

<style scoped>
.info-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info-tooltip__trigger {
  display: inline-grid;
  width: 1.125rem;
  height: 1.125rem;
  padding: 0;
  border: 1px solid rgb(58 77 60 / 35%);
  border-radius: 50%;
  background: transparent;
  color: var(--color-evergreen, #314830);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  cursor: help;
  place-items: center;
}

.info-tooltip__trigger:hover,
.info-tooltip__trigger:focus-visible {
  border-color: var(--color-evergreen, #314830);
  background: rgb(49 72 48 / 10%);
}

.info-tooltip__bubble {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.375rem);
  left: 0;
  display: block;
  width: max-content;
  max-width: 18rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 25%);
  border-radius: 0.375rem;
  background: var(--color-ink, #252b25);
  color: white;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
}

.info-tooltip__text {
  display: block;
}

.info-tooltip__link {
  display: inline-block;
  margin-top: 0.375rem;
  color: #d7e5d6;
  font-weight: 600;
  text-decoration: underline;
}

.info-tooltip__link:hover {
  color: white;
}
</style>
