import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import {
  makeAdminRole,
  makeAdminUser,
  makeRolesRouteMocks,
  makeUsersRouteMocks,
} from "@/test/admin-handlers";
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

const confirmDialogButton = (label: string): HTMLButtonElement => {
  const dialog = [
    ...document.body.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ].at(-1);
  const button = [
    ...(dialog?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ].find((candidate) => candidate.textContent?.trim() === label);
  if (button === undefined)
    throw new Error(`Botão de confirmação não encontrado: ${label}`);
  return button;
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

const selectProfile = async (name: string): Promise<void> => {
  const labels: Record<string, string> = {
    admin: "Administrador — Acesso administrativo ao sistema",
    manager: "Gerente — Gerencia usuários e operações",
  };
  const selector = `[aria-label="${labels[name]}"][role="option"]`;
  await vi.waitFor(() => expect(dialogGet(selector)).toBeDefined());
  await setValue(selector, true);
};

const roleMocks = () =>
  makeRolesRouteMocks([
    makeAdminRole({ id: 1, name: "admin" }),
    makeAdminRole({ id: 4, name: "manager" }),
  ]);

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

  it("creates the user and notifies the caller; clean form cancels without confirmation", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
    const wrapper = await mountModal();
    expect(dialogGet(".user-form__roles--scroll")).toBeDefined();
    expect(document.body.textContent).toContain(
      "Selecione um ou mais perfis para a conta.",
    );
    dialogGet('[data-testid="cancel-create"]').click();
    expect(wrapper.emitted("update:modelValue")).toContainEqual([false]);

    await wrapper.setProps({ modelValue: true });
    await fillValidForm();
    await selectProfile("admin");
    await selectProfile("manager");
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
      roles: ["admin", "manager"],
    });
    expect(document.body.querySelectorAll(".required-mark")).toHaveLength(5);
  });

  it("requires at least one role before submitting", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
    await mountModal();

    await fillValidForm();
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "Selecione ao menos um perfil.",
      ),
    );
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("validates CPF and password locally before calling the API", async () => {
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

  it("preserves data and modal when the API rejects with 422", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/users`, async ({ request }) =>
        HttpResponse.json(
          {
            message: "Dados inválidos.",
            errors: {
              "roles.0": ["O perfil escolhido não está disponível."],
            },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const wrapper = await mountModal();

    await fillValidForm();
    await selectProfile("manager");
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "O perfil escolhido não está disponível.",
      ),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Nome do novo usuário"]').value,
    ).toBe("Novo Usuário");
    expect(
      dialogGet('[aria-label="Perfis selecionados"]').textContent,
    ).toContain("Gerente");
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Gerente — Gerencia usuários e operações"]',
      ).checked,
    ).toBe(true);
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(wrapper.emitted("created")).toBeUndefined();
  });

  it("blocks double submit and closing while save is pending", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
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
    const wrapper = await mountModal();
    await fillValidForm();
    await selectProfile("manager");
    dialogGet('[data-testid="submit-create-user"]').click();
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLButtonElement>('[data-testid="cancel-create"]').disabled,
      ).toBe(true),
    );
    pressEscape();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(posted).toHaveLength(1);
  });

  it("asks for discard on dirty form and saves nothing", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal();
    await setValue('[aria-label="Nome do novo usuário"]', "Rascunho");
    dialogGet('[data-testid="cancel-create"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar o novo usuário?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("does not save without users.manage", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers);
    await mountModal(["users.view"]);

    await fillValidForm();
    dialogGet('[data-testid="submit-create-user"]').click();
    await Promise.resolve();

    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
    expect(document.body.textContent).toContain(
      "A permissão users.manage é necessária",
    );
  });

  it("neither fetches nor saves without users.assign-roles", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
    await mountModal(["users.manage", "roles.view"]);

    expect(document.body.textContent).toContain(
      "A permissão users.assign-roles é necessária",
    );
    expect(roles.calls).toHaveLength(0);
    dialogGet('[data-testid="submit-create-user"]').click();
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("skips catalog fetch without roles.view and blocks creation without a role", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
    await mountModal(["users.manage", "users.assign-roles"]);

    expect(document.body.textContent).toContain(
      "A permissão roles.view é necessária para consultar o catálogo.",
    );
    expect(roles.calls).toHaveLength(0);
    await fillValidForm();
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "Selecione ao menos um perfil.",
      ),
    );
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("explains a 403 rejection without discarding data or role", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    const roles = roleMocks();
    server.use(...mocks.handlers, ...roles.handlers);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/users`, async ({ request }) =>
        HttpResponse.json(
          { message: "A criação foi bloqueada pela autorização." },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    await mountModal();

    await fillValidForm();
    await selectProfile("manager");
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "Sua conta não tem permissão para esta ação.",
      ),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Email do novo usuário"]').value,
    ).toBe("novo@example.test");
    expect(
      dialogGet('[aria-label="Perfis selecionados"]').textContent,
    ).toContain("Gerente");
  });

  it("renders the Name label with inline asterisk", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers, ...roleMocks().handlers);
    await mountModal();

    const label = dialogGet(".user-form .form-label__text");
    expect(label.textContent?.replace(/\s+/g, " ")).toContain("Nome *");
    expect(label.querySelector(".required-mark")).not.toBeNull();
    expect(label.nextElementSibling?.tagName).toBe("INPUT");
  });

  it("shows Password with inline asterisk and short hint below the field", async () => {
    const mocks = makeUsersRouteMocks([makeAdminUser({ id: 9 })]);
    server.use(...mocks.handlers, ...roleMocks().handlers);
    await mountModal();

    const labels = [
      ...dialogGet(".user-form").querySelectorAll(".form-label__text"),
    ];
    const password = labels.find((element) =>
      element.textContent?.includes("Senha"),
    );
    expect(password?.textContent?.replace(/\s+/g, " ")).toContain("Senha *");
    const hint = password?.closest("label")?.querySelector(".user-form__hint");
    expect(hint?.textContent).toContain("Mínimo 12 caracteres.");
  });
});
