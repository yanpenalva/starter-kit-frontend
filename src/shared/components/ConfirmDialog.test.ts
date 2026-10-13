import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import ConfirmDialog from "./ConfirmDialog.vue";

describe("ConfirmDialog", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => wrapper?.unmount());

  it("shows custom copy and emits confirmation after opening", async () => {
    wrapper = mount(ConfirmDialog, {
      attachTo: document.body,
      props: {
        modelValue: true,
        title: "Excluir usuário",
        message: "Deseja excluir?",
        confirmLabel: "Excluir",
      },
    });

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Deseja excluir?"),
    );
    expect(document.body.textContent).toContain("Deseja excluir?");
    const button = [...document.body.querySelectorAll("button")].find(
      (item) => item.textContent?.trim() === "Excluir",
    );
    await vi.waitFor(() => expect(button).toBe(document.activeElement));
    button?.click();
    expect(wrapper.emitted("confirm")).toHaveLength(1);
  });
});
