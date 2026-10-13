import { afterEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import DialogComponent from "./DialogComponent.vue";

const mounted: VueWrapper[] = [];

const mountDialog = (
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
): VueWrapper => {
  const wrapper = mount(DialogComponent, {
    attachTo: document.body,
    props: {
      modelValue: false,
      title: "Detalhes do registro 7",
      ...props,
    },
    slots: {
      default: () => h("p", { class: "body" }, "Conteúdo do registro"),
      ...slots,
    },
  });
  mounted.push(wrapper);
  return wrapper;
};

const dialogElement = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('[role="dialog"]');

const dialogButton = (text: string): HTMLButtonElement | undefined =>
  [...document.body.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent?.trim() === text,
  );

const openDialog = async (wrapper: VueWrapper): Promise<HTMLElement> => {
  await wrapper.setProps({ modelValue: true });
  await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
  return dialogElement() as HTMLElement;
};

const closeDialog = async (wrapper: VueWrapper): Promise<void> => {
  await wrapper.setProps({ modelValue: false });
  await vi.waitFor(() => expect(dialogElement()).toBeNull());
};

const pressEscape = (): void => {
  for (const type of ["keydown", "keyup"]) {
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", keyCode: 27, bubbles: true }),
    );
  }
};

const pressBackdrop = (): void => {
  document.body
    .querySelector(".q-dialog__backdrop")
    ?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
};

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  document.body.innerHTML = "";
});

describe("DialogComponent.vue", () => {
  it("teleporta o diálogo para o documento e usa o título como nome acessível", async () => {
    const wrapper = mountDialog();

    expect(dialogElement()).toBeNull();

    const dialog = await openDialog(wrapper);

    expect(wrapper.element.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.textContent).toContain("Conteúdo do registro");

    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).not.toBeNull();
    const title = document.getElementById(labelledBy as string);
    expect(title?.tagName).toBe("H2");
    expect(title?.textContent).toBe("Detalhes do registro 7");
  });

  it("fecha pelo botão explícito, por Escape e pelo backdrop, avisando o caller", async () => {
    const wrapper = mountDialog();
    await openDialog(wrapper);

    dialogButton("Fechar")?.click();
    await vi.waitFor(() =>
      expect(wrapper.emitted("update:modelValue")).toContainEqual([false]),
    );
    await closeDialog(wrapper);
    await vi.waitFor(() => expect(wrapper.emitted("close")).toBeTruthy());

    await openDialog(wrapper);
    pressEscape();
    await vi.waitFor(() =>
      expect(wrapper.emitted("update:modelValue")?.length).toBe(2),
    );
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
    await closeDialog(wrapper);

    await openDialog(wrapper);
    pressBackdrop();
    await vi.waitFor(() =>
      expect(wrapper.emitted("update:modelValue")?.length).toBe(3),
    );
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
  });

  it("mantém o diálogo aberto quando é persistente (política fica no form)", async () => {
    const wrapper = mountDialog({ persistent: true });
    await openDialog(wrapper);

    pressEscape();
    pressBackdrop();
    await Promise.resolve();

    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(dialogElement()).not.toBeNull();
  });

  it("substitui o botão Fechar pelas ações do caller", async () => {
    const wrapper = mountDialog(
      {},
      {
        actions: () =>
          h("button", { type: "button", id: "custom-action" }, "Cancelar"),
      },
    );
    await openDialog(wrapper);

    expect(dialogButton("Fechar")).toBeUndefined();
    const custom = document.querySelector<HTMLButtonElement>("#custom-action");
    expect(custom?.textContent).toBe("Cancelar");
  });

  it("devolve o foco ao acionador depois de fechar", async () => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.textContent = "Ver detalhes";
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mountDialog();
    await openDialog(wrapper);
    await vi.waitFor(() => expect(document.activeElement).not.toBe(trigger));

    dialogButton("Fechar")?.click();
    await closeDialog(wrapper);

    await vi.waitFor(() => expect(document.activeElement).toBe(trigger), {
      timeout: 2000,
    });
  });
});
