<template>
  <button type="button" class="back-button" aria-label="Voltar" @click="goBack">
    <span class="material-icons" aria-hidden="true">arrow_back</span>
    Voltar
  </button>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const props = withDefaults(defineProps<{ fallback?: string }>(), {
  fallback: "/",
});

const router = useRouter();
const goBack = (): void => {
  const historyState = router.options.history.state;
  if (Number(historyState.position) > 0) {
    router.back();
    return;
  }
  void router.push(props.fallback);
};
</script>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0;
  border: 0;
  background: transparent;
  color: var(--color-evergreen);
  font: inherit;
  cursor: pointer;
}

.material-icons {
  font-size: 1.125rem;
}
</style>
