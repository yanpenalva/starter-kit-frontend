<template>
  <label class="ui-search">
    <span class="ui-search__label">{{ label }}</span>
    <input
      class="ui-control"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  { label: "Buscar", placeholder: "", disabled: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const handleInput = (event: Event): void => {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
};
</script>

<style scoped>
.ui-search {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}
</style>
