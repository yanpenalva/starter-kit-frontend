<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    :persistent="busy"
    @update:model-value="handleVisibility"
  >
    <p>{{ message }}</p>
    <template #actions>
      <button type="button" class="ui-control" :disabled="busy" @click="cancel">
        {{ cancelLabel }}
      </button>
      <button
        ref="confirmButton"
        autofocus
        type="button"
        class="ui-control ui-control--primary"
        :disabled="busy"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </DialogComponent>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busy?: boolean;
  }>(),
  { confirmLabel: "Confirmar", cancelLabel: "Cancelar", busy: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

const confirmButton = ref<HTMLButtonElement | null>(null);
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    await nextTick();
    setTimeout(() => confirmButton.value?.focus(), 0);
  },
);

const cancel = (): void => emit("update:modelValue", false);
const handleVisibility = (open: boolean): void => {
  if (!open) cancel();
};
</script>
