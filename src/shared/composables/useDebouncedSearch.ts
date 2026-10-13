import { onScopeDispose, watch, type Ref } from "vue";

export const useDebouncedSearch = (
  input: Ref<string>,
  apply: (value: string) => void,
  delayMs = 300,
): void => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(input, (value) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      apply(value);
    }, delayMs);
  });

  onScopeDispose(() => {
    if (timer !== null) clearTimeout(timer);
  });
};
