import { computed, getCurrentScope, onScopeDispose, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import {
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
  describeHttpError,
  firstValidationMessage,
} from "@/lib/http";
import type { RetryableHttpError } from "./useFormFeedback.types";

export interface FormFeedback {
  readonly fieldErrors: Ref<Readonly<Record<string, readonly string[]>>>;
  readonly errorMessage: Ref<string | null>;
  readonly successMessage: Ref<string | null>;
  readonly rateLimitSeconds: Ref<number | null>;
  readonly canRetry: ComputedRef<boolean>;
  handleFailure: (error: unknown, operation?: () => Promise<unknown>) => void;
  reportSuccess: (message: string) => void;
  run: <T>(operation: () => Promise<T>) => Promise<T>;
  retry: () => Promise<void>;
  clearFeedback: () => void;
}

const RETRYABLE_KINDS: ReadonlySet<string> = new Set([
  "network",
  "server_error",
  "unexpected",
  "rate_limited",
]);

const isRetryableKind = (kind: string): boolean => RETRYABLE_KINDS.has(kind);

export const useFormFeedback = (): FormFeedback => {
  const fieldErrors = ref<Readonly<Record<string, readonly string[]>>>({});
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const rateLimitSeconds = ref<number | null>(null);
  const retryAvailable = ref(false);
  let lastOperation: (() => Promise<unknown>) | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let mounted = true;

  const stopCountdown = (): void => {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  };

  const startCountdown = (seconds: number): void => {
    stopCountdown();
    rateLimitSeconds.value = seconds;
    countdownTimer = setInterval(() => {
      if (!mounted) return;
      const current = rateLimitSeconds.value ?? 0;
      if (current <= 1) {
        stopCountdown();
        rateLimitSeconds.value = null;
        return;
      }
      rateLimitSeconds.value = current - 1;
    }, 1000);
  };

  const clearFeedback = (): void => {
    fieldErrors.value = {};
    errorMessage.value = null;
    successMessage.value = null;
    retryAvailable.value = false;
  };

  const handleFailure = (
    error: unknown,
    operation?: () => Promise<unknown>,
  ): void => {
    clearFeedback();
    const retryable = operation !== undefined && isRetryableKind(kindOf(error));
    lastOperation = retryable ? operation : null;
    retryAvailable.value = retryable;
    if (isValidationHttpError(error)) {
      fieldErrors.value = error.fieldErrors;
      errorMessage.value = firstValidationMessage(error);
      return;
    }
    if (isRateLimitedHttpError(error)) {
      if (error.retryAfterSeconds !== null) {
        startCountdown(error.retryAfterSeconds);
      }
      errorMessage.value = describeHttpError(error);
      return;
    }
    errorMessage.value = describeHttpError(error);
  };

  const reportSuccess = (message: string): void => {
    clearFeedback();
    lastOperation = null;
    successMessage.value = message;
  };
  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    clearFeedback();
    try {
      const result = await operation();
      return result;
    } catch (error: unknown) {
      lastOperation = isRetryableKind(kindOf(error)) ? operation : null;
      handleFailure(error, operation);
      throw error;
    }
  };

  const retry = async (): Promise<void> => {
    if (lastOperation === null) return;
    const operation = lastOperation;
    clearFeedback();
    try {
      await operation();
      reportSuccess("Operação concluída com sucesso.");
    } catch (error: unknown) {
      handleFailure(error, operation);
    }
  };

  if (getCurrentScope() !== undefined) {
    onScopeDispose(() => {
      mounted = false;
      stopCountdown();
    });
  }

  return {
    fieldErrors,
    errorMessage,
    successMessage,
    rateLimitSeconds,
    canRetry: computed(() => retryAvailable.value),
    handleFailure,
    reportSuccess,
    run,
    retry,
    clearFeedback,
  };
};

const kindOf = (error: unknown): string => {
  return isHttpError(error) ? error.kind : "unexpected";
};

export type { RetryableHttpError };
