<template>
  <span class="form-label__text"
    ><slot /> <RequiredMark v-if="required"
  /></span>
</template>

<script setup lang="ts">
import RequiredMark from "@/shared/components/RequiredMark.vue";

withDefaults(
  defineProps<{
    required?: boolean;
  }>(),
  {
    required: false,
  },
);
</script>

<style scoped>
.form-label__text {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font: inherit;
}
</style>
