import { onMounted, onUnmounted, watch } from "vue";

export interface FormDismissGuard {
  canDismiss: () => boolean;
}

export const useFormDismissGuard = (options: {
  isDirty: () => boolean;
  isPending: () => boolean;
  message: string;
}): FormDismissGuard => {
  const canDismiss = (): boolean => {
    if (options.isPending()) return false;
    if (!options.isDirty()) return true;
    return globalThis.confirm(options.message);
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

  return { canDismiss };
};
