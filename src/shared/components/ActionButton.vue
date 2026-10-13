<template>
  <button
    class="ui-control action-button"
    :class="{ 'action-button--icon': icon !== undefined }"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="icon === undefined ? undefined : label"
    :title="icon === undefined ? undefined : label"
    @click="handleClick"
  >
    <span v-if="icon" class="material-icons" aria-hidden="true">{{
      icon
    }}</span>
    <span :class="{ 'action-button__label--hidden': icon !== undefined }">
      {{ label }}
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
  }>(),
  { type: "button", disabled: false, loading: false, icon: undefined },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent): void => {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }
  emit("click", event);
};
</script>

<style scoped>
.action-button--icon {
  display: inline-flex;
  min-width: 2.75rem;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
}

.action-button--icon .material-icons {
  font-size: 1.25rem;
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
