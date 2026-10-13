import { defineComponent, h, ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { useFormDismissGuard } from "./useFormDismissGuard";

describe("useFormDismissGuard beforeunload", () => {
  it("attaches only while dirty and removes the listener when clean or unmounted", () => {
    const isDirty = ref(false);
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const wrapper = mount(
      defineComponent({
        setup() {
          useFormDismissGuard({
            isDirty: () => isDirty.value,
            isPending: () => false,
            message: "Descartar alterações?",
          });
          return () => h("div");
        },
      }),
    );

    const countBeforeUnload = (calls: unknown[][]): number =>
      calls.filter(([type]) => type === "beforeunload").length;

    try {
      expect(countBeforeUnload(addListener.mock.calls)).toBe(0);

      isDirty.value = true;
      expect(countBeforeUnload(addListener.mock.calls)).toBe(1);
      const dirtyEvent = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(dirtyEvent);
      expect(dirtyEvent.defaultPrevented).toBe(true);

      isDirty.value = false;
      expect(countBeforeUnload(removeListener.mock.calls)).toBe(1);

      isDirty.value = true;
      expect(countBeforeUnload(addListener.mock.calls)).toBe(2);
      wrapper.unmount();
      expect(countBeforeUnload(removeListener.mock.calls)).toBe(2);

      const unmountedEvent = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(unmountedEvent);
      expect(unmountedEvent.defaultPrevented).toBe(false);
    } finally {
      wrapper.unmount();
      addListener.mockRestore();
      removeListener.mockRestore();
    }
  });
});
