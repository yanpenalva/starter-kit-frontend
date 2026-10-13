<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    :aria-labelledby="titleId"
    @update:model-value="handleVisibilityChange"
    @hide="emit('close')"
  >
    <q-card class="ui-dialog">
      <header class="ui-dialog__header">
        <h2 :id="titleId" class="ui-dialog__title">{{ title }}</h2>
      </header>

      <div class="ui-dialog__body">
        <slot />
      </div>

      <footer class="ui-dialog__actions">
        <slot name="actions">
          <button type="button" class="ui-control" @click="requestClose">
            Fechar
          </button>
        </slot>
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useId } from "vue";

withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    persistent?: boolean;
  }>(),
  { persistent: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
}>();

const titleId = `ui-dialog-title-${useId()}`;

const handleVisibilityChange = (value: boolean): void => {
  emit("update:modelValue", value);
};

const requestClose = (): void => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.ui-dialog {
  display: flex;
  width: min(100%, 44rem);
  max-width: 100%;
  max-height: min(90vh, 48rem);
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: var(--color-panel, #fffefb);
  color: var(--color-ink, #252a25);
}

.ui-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.ui-dialog__title {
  margin: 0;
  font-family: var(--type-display, inherit);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--color-ink, #252a25);
}

.ui-dialog__body {
  display: grid;
  min-height: 0;
  flex: 1 1 auto;
  gap: 1rem;
  overflow-y: auto;
}

.ui-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
