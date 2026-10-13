<template>
  <span
    class="action-button-shell"
    :tabindex="isUnavailable && tooltip ? 0 : undefined"
    :aria-describedby="isUnavailable && tooltip ? tooltipId : undefined"
  >
    <button
      class="ui-control action-button"
      :class="[
        { 'action-button--icon': icon !== undefined },
        color ? `action-button--${color}` : undefined,
      ]"
      :type="type"
      :disabled="disabled || loading"
      :aria-busy="loading ? 'true' : undefined"
      :aria-label="icon === undefined ? undefined : label"
      :title="
        isUnavailable
          ? undefined
          : (tooltip ?? (icon === undefined ? undefined : label))
      "
      :aria-description="tooltip"
      :style="iconSize ? { '--action-icon-size': `${iconSize}px` } : undefined"
      @click="handleClick"
    >
      <span v-if="icon" class="material-icons" aria-hidden="true">{{
        icon
      }}</span>
      <span :class="{ 'action-button__label--hidden': icon !== undefined }">
        {{ label }}
      </span>
    </button>
    <span
      v-if="isUnavailable && tooltip"
      :id="tooltipId"
      class="action-button-tooltip"
      role="tooltip"
    >
      {{ tooltip }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    color?: "info" | "warning" | "error" | "success";
    iconSize?: number;
    tooltip?: string;
  }>(),
  {
    type: "button",
    disabled: false,
    loading: false,
    icon: undefined,
    color: undefined,
    iconSize: undefined,
    tooltip: undefined,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const tooltipId = `action-button-tooltip-${useId()}`;
const isUnavailable = computed(() => props.disabled || props.loading);

const handleClick = (event: MouseEvent): void => {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }
  emit("click", event);
};
</script>

<style scoped>
.action-button-shell {
  position: relative;
  display: inline-flex;
}

.action-button-tooltip {
  position: absolute;
  z-index: 1;
  top: calc(100% + 0.375rem);
  left: 50%;
  width: max-content;
  max-width: 18rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--color-ink, #252a25);
  color: white;
  font-size: 0.75rem;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition: opacity 120ms ease;
}

.action-button-shell:hover .action-button-tooltip,
.action-button-shell:focus .action-button-tooltip {
  opacity: 1;
}

.action-button--icon {
  display: inline-flex;
  min-width: 2.75rem;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
}

.action-button--icon .material-icons {
  font-size: var(--action-icon-size, 1.125rem);
}

.action-button--info {
  color: var(--color-info);
}

.action-button--warning {
  color: var(--color-warning);
}

.action-button--error {
  color: var(--color-error);
}

.action-button--success {
  color: var(--color-success);
}

.action-button__label--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
