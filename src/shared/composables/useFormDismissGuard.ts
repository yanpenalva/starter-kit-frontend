import { onMounted, onUnmounted, ref, watch } from "vue";
import type { Ref } from "vue";

export interface FormDismissGuard {
  confirmOpen: Readonly<Ref<boolean>>;
  message: string;
  requestDismiss: (dismiss: () => void) => void;
  confirmDismiss: () => void;
  cancelDismiss: () => void;
}

export const useFormDismissGuard = (options: {
  isDirty: () => boolean;
  isPending: () => boolean;
  message: string;
}): FormDismissGuard => {
  const confirmOpen = ref(false);
  let pendingDismiss: (() => void) | null = null;

  const requestDismiss = (dismiss: () => void): void => {
    if (options.isPending()) return;
    if (!options.isDirty()) {
      dismiss();
      return;
    }
    pendingDismiss = dismiss;
    confirmOpen.value = true;
  };

  const confirmDismiss = (): void => {
    const dismiss = pendingDismiss;
    pendingDismiss = null;
    confirmOpen.value = false;
    dismiss?.();
  };

  const cancelDismiss = (): void => {
    pendingDismiss = null;
    confirmOpen.value = false;
  };

  const beforeWindowUnload = (event: BeforeUnloadEvent): void => {
    if (!options.isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  };

  let listenerAttached = false;
  let isMounted = false;

  const syncBeforeUnloadListener = (): void => {
    if (!isMounted) return;
    const shouldAttach = options.isDirty();
    if (shouldAttach === listenerAttached) return;

    listenerAttached = shouldAttach;
    if (shouldAttach) {
      window.addEventListener("beforeunload", beforeWindowUnload);
      return;
    }
    window.removeEventListener("beforeunload", beforeWindowUnload);
  };

  watch(options.isDirty, syncBeforeUnloadListener, { flush: "sync" });

  onMounted(() => {
    isMounted = true;
    syncBeforeUnloadListener();
  });
  onUnmounted(() => {
    isMounted = false;
    if (listenerAttached) {
      listenerAttached = false;
      window.removeEventListener("beforeunload", beforeWindowUnload);
    }
  });

  return {
    confirmOpen,
    message: options.message,
    requestDismiss,
    confirmDismiss,
    cancelDismiss,
  };
};
