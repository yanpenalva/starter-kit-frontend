<template>
  <span
    class="required-mark"
    tabindex="0"
    role="img"
    aria-label="Campo obrigatório"
  >
    <span aria-hidden="true">*</span>
    <span class="required-mark__tooltip" role="tooltip">Campo obrigatório</span>
  </span>
</template>

<style scoped>
.required-mark {
  position: relative;
  display: inline-block;
  margin-inline-start: 0.2rem;
  color: var(--color-error, #a4473e);
  font-weight: 700;
}

.required-mark__tooltip {
  position: absolute;
  z-index: 1;
  inset-block-end: calc(100% + 0.375rem);
  inset-inline-start: 50%;
  width: max-content;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--color-ink, #252a25);
  color: white;
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
}

.required-mark:hover .required-mark__tooltip,
.required-mark:focus-visible .required-mark__tooltip {
  opacity: 1;
}
</style>
