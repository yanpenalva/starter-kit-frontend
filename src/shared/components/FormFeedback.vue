<script setup lang="ts">
import { computed } from "vue";
import type { FormFeedback } from "@/shared/composables/useFormFeedback";

const props = defineProps<{
  feedback: FormFeedback;
  retryLabel?: string;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const message = computed<string | null>(() => {
  if (props.feedback.rateLimitSeconds.value !== null) {
    const seconds = props.feedback.rateLimitSeconds.value;
    return `Muitas tentativas. Aguarde ${seconds} ${
      seconds === 1 ? "segundo" : "segundos"
    } e tente novamente.`;
  }
  return props.feedback.errorMessage.value;
});
</script>

<template>
  <p
    v-if="feedback.successMessage.value"
    role="status"
    class="form-feedback form-feedback--success"
  >
    {{ feedback.successMessage.value }}
  </p>
  <div
    v-if="message !== null"
    role="alert"
    class="form-feedback form-feedback--error"
  >
    <span>{{ message }}</span>
    <button
      v-if="feedback.canRetry.value"
      type="button"
      class="form-feedback__retry"
      :aria-label="props.retryLabel ?? 'Tentar novamente'"
      @click="emit('retry')"
    >
      {{ props.retryLabel ?? "Tentar novamente" }}
    </button>
  </div>
</template>

<style scoped>
.form-feedback {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}

.form-feedback--error {
  border: 1px solid rgb(180 35 24 / 30%);
  background: rgb(180 35 24 / 6%);
  color: #b42318;
}

.form-feedback--success {
  border: 1px solid rgb(6 95 70 / 25%);
  background: #ecfdf5;
  color: #065f46;
}

.form-feedback__retry {
  min-height: 1.75rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid rgb(180 35 24 / 40%);
  border-radius: 0.375rem;
  background: white;
  color: #b42318;
  font-size: 0.8125rem;
  cursor: pointer;
}

.form-feedback__retry:hover {
  background: rgb(180 35 24 / 8%);
}
</style>
