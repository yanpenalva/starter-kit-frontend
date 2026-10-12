<script setup lang="ts">
const props = defineProps<{
  errors: readonly string[];
  fieldLabel: string;
}>();

const describedById = `field-error-${props.fieldLabel
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .toLowerCase()}`;
</script>

<template>
  <ul v-if="props.errors.length > 0" :id="describedById" class="field-errors">
    <li v-for="message in props.errors" :key="message" role="alert">
      {{ message }}
    </li>
  </ul>
</template>

<style scoped>
.field-errors {
  display: grid;
  gap: 0.25rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
  color: #b42318;
  font-size: 0.8125rem;
}
</style>
