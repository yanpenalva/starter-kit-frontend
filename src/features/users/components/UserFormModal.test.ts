import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { makeAdminUser, makeUsersRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { queryClient } from "@/app/providers/query";
import UserFormModal from "./UserFormModal.vue";

const mountedWrappers: VueWrapper[] = [];

const mountModal = async (
  permissions: readonly string[] = [...CATALOGUE_PERMISSIONS],
) => {
  queryClient.clear();
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...permissions],
  };
  const wrapper = mount(UserFormModal, {
    attachTo: document.body,
    props: { modelValue: true },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  mountedWrappers.push(wrapper);
  await vi.waitFor(() =>
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull(),
  );
  return wrapper;
};

const dialogGet = <T extends HTMLElement = HTMLElement>(
  selector: string,
): T => {
  const element =
    document.body
      .querySelector<HTMLElement>('[role="dialog"]')
      ?.querySelector<T>(selector) ?? null;
  if (element === null) {
    throw new Error(`Elemento do diálogo não encontrado: ${selector}`);
  }
  return element;
};

const setValue = async (
  selector: string,
  value: string | boolean,
): Promise<void> => {
  const element = dialogGet<HTMLInputElement>(selector);
  if (typeof value === "boolean") {
    element.checked = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const fillValidForm = async (): Promise<void> => {
  await setValue('[aria-label="Nome do novo usuário"]', "Novo Usuário");
  await setValue('[aria-label="Email do novo usuário"]', "novo@example.test");
  await setValue('[aria-label="CPF do novo usuário"]', "12345678909");
  await setValue('[aria-label="Senha do novo usuário"]', "Alterar123!x");
};

const pressEscape = (): void => {
  for (const type of ["keydown", "keyup"]) {
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", keyCode: 27, bubbles: true }),
    );
  }
};

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
});

describe("UserFormModal", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("cria o usuário e avisa o caller; form limpo cancela sem confirmação", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal();
    const confirmSpy = vi.spyOn(globalThis, "confirm");

    try {
      expect(document.body.textContent).toContain(
        "A criação não atribui perfis. Após o cadastro, abra a edição do usuário para atribuir perfis em uma etapa separada.",
      );
      const cancel = dialogGet('[data-testid="cancel-create"]');
      cancel.click();
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(wrapper.emitted("update:modelValue")).toContainEqual([false]);

      await wrapper.setProps({ modelValue: true });
      await fillValidForm();
      dialogGet('[data-testid="submit-create-user"]').click();

      await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
      const createCall = mocks.calls.find(
        (call) => call.method === "POST" && call.path === "/api/v1/users",
      );
      expect(createCall?.body).toMatchObject({
        name: "Novo Usuário",
        email: "novo@example.test",
        cpf: "12345678909",
        password: "Alterar123!x",
        active: false,
      });
      expect(createCall?.body).not.toHaveProperty("roles");
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("valida CPF e senha localmente antes de chamar a API", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    await mountModal();

    await fillValidForm();
    await setValue('[aria-label="CPF do novo usuário"]', "123");
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "Informe um CPF válido com 11 dígitos.",
      ),
    );
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );

    await setValue('[aria-label="CPF do novo usuário"]', "12345678909");
    await setValue('[aria-label="Senha do novo usuário"]', "curta");
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "A senha deve ter pelo menos 12 caracteres.",
      ),
    );
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("preserva os dados e o modal quando a API rejeita com 422", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/users`, async ({ request }) =>
        HttpResponse.json(
          {
            message: "Dados inválidos.",
            errors: { email: ["O email já está em uso."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const wrapper = await mountModal();

    await fillValidForm();
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("O email já está em uso."),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Email do novo usuário"]').value,
    ).toBe("novo@example.test");
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(wrapper.emitted("created")).toBeUndefined();
  });

  it("bloqueia submit duplo e o fechamento enquanto a gravação está pendente", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    const posted: unknown[] = [];
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/users`, async ({ request }) => {
        await delay(80);
        posted.push(await request.json());
        return HttpResponse.json(
          { data: makeAdminUser({ id: 9 }) },
          { status: 201, headers: makeCorsHeaders(request) },
        );
      }),
    );
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    const wrapper = await mountModal();

    try {
      await fillValidForm();
      dialogGet('[data-testid="submit-create-user"]').click();
      dialogGet('[data-testid="submit-create-user"]').click();

      await vi.waitFor(() =>
        expect(
          dialogGet<HTMLButtonElement>('[data-testid="cancel-create"]')
            .disabled,
        ).toBe(true),
      );
      pressEscape();
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();

      await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
      expect(posted).toHaveLength(1);
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("pede descarte para form sujo e não grava nada", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    const wrapper = await mountModal();

    try {
      await setValue('[aria-label="Nome do novo usuário"]', "Rascunho");
      dialogGet('[data-testid="cancel-create"]').click();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
      expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
        0,
      );
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("não grava sem users.manage", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    await mountModal(["users.view"]);

    await fillValidForm();
    dialogGet('[data-testid="submit-create-user"]').click();
    await Promise.resolve();

    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });
});
