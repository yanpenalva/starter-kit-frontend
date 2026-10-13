import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { http, HttpResponse } from "msw";
import { useSessionStore } from "@/features/auth/stores/session";
import type { MyProfileResource } from "@/lib/api/generated/models";
import { CSRF_COOKIE_NAME } from "@/lib/http/config";
import { server } from "@/test/server";
import {
  makeCorsHeaders,
  TEST_API_BASE,
  TEST_CSRF_TOKEN,
} from "@/test/http-handlers";
import ProfilePage from "./ProfilePage.vue";

const PROFILE_URL = `${TEST_API_BASE}/api/v1/auth/my-profile`;
const PASSWORD_URL = `${TEST_API_BASE}/api/v1/auth/password`;
const CSRF_COOKIE_URL = `${TEST_API_BASE}/sanctum/csrf-cookie`;

const verifiedUser: MyProfileResource = {
  id: 7,
  name: "Ana Usuária",
  email: "ana@example.com",
  email_verified_at: "2026-10-01T12:00:00Z",
  roles: ["member"],
  permissions: ["logs.view"],
};

const limitedUser: MyProfileResource = {
  ...verifiedUser,
  email_verified_at: null,
  roles: [],
  permissions: [],
};

const mountPage = () => {
  return mount(ProfilePage, {
    global: {
      stubs: {
        AppLayout: { template: "<main><slot /></main>" },
        RouterLink: {
          name: "RouterLink",
          props: ["to"],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });
};

describe("ProfilePage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    server.use(
      http.options(
        "*",
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
    );
  });

  afterEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; path=/`;
  });

  it("exibe a identidade, abre detalhes traduzidos e preserva a navegação da conta", async () => {
    const session = useSessionStore();
    session.user = verifiedUser;
    session.status = "authenticated";

    const wrapper = mountPage();

    expect(wrapper.get("h1").text()).toBe("Minha Conta");
    expect(wrapper.get<HTMLInputElement>("#profile-name").element.value).toBe(
      "Ana Usuária",
    );
    expect(wrapper.text()).toContain("ana@example.com");
    expect(wrapper.text()).toContain("Verificado");
    expect(wrapper.text()).toContain("Ver perfis (1)");
    expect(wrapper.text()).toContain("Ver permissões (1)");
    expect(wrapper.find("input[type=email]").exists()).toBe(false);
    expect(wrapper.get('a[href="/sessions"]').text()).toBe(
      "Ver sessões ativas",
    );

    await wrapper.get("button.profile-page__detail-link").trigger("click");
    await flushPromises();
    expect(document.body.textContent).toContain("member");
    expect(
      document.body.querySelector('[aria-labelledby="roles-dialog-title"]'),
    ).not.toBeNull();

    await document.body
      .querySelector<HTMLButtonElement>(".profile-page__dialog-close")
      ?.click();
    await wrapper
      .findAll("button.profile-page__detail-link")[1]
      ?.trigger("click");
    await flushPromises();
    expect(document.body.textContent).toContain("Ver auditoria");
    expect(
      document.body.querySelector(
        '[aria-labelledby="permissions-dialog-title"]',
      ),
    ).not.toBeNull();
    wrapper.unmount();
  });

  it("traduz nomes dos perfis reservados sem mudar os identificadores da conta", async () => {
    useSessionStore().user = {
      ...verifiedUser,
      roles: ["admin", "user"],
      permissions: [],
    };

    const wrapper = mountPage();
    await wrapper.get("button.profile-page__detail-link").trigger("click");
    await flushPromises();

    const dialog = document.body.querySelector(
      '[aria-labelledby="roles-dialog-title"]',
    );
    expect(dialog?.textContent).toContain("Administrador");
    expect(dialog?.textContent).toContain("Usuário");
    expect(dialog?.textContent).not.toContain("admin");
    wrapper.unmount();
  });

  it("informa quando o e-mail ainda não foi verificado", () => {
    const session = useSessionStore();
    session.user = limitedUser;
    session.status = "limited";

    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Pendente de verificação");
    expect(wrapper.text()).toContain("Nenhum");
  });

  it("atualiza o nome da sessão com a resposta de PATCH", async () => {
    let requestBody: unknown;
    let requestMethod = "";
    server.use(
      http.patch(PROFILE_URL, async ({ request }) => {
        requestMethod = request.method;
        requestBody = await request.json();
        return HttpResponse.json(
          { data: { ...verifiedUser, name: "Ana Atualizada" } },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const session = useSessionStore();
    session.user = verifiedUser;
    session.status = "authenticated";
    const wrapper = mountPage();

    await wrapper
      .get<HTMLInputElement>("#profile-name")
      .setValue("Ana Atualizada");
    await wrapper.get('form[aria-label="Atualizar nome"]').trigger("submit");
    await vi.waitFor(() => expect(session.user?.name).toBe("Ana Atualizada"));
    await flushPromises();

    expect(requestMethod).toBe("PATCH");
    expect(requestBody).toEqual({ name: "Ana Atualizada" });
    expect(session.user?.name).toBe("Ana Atualizada");
    expect(wrapper.text()).toContain("Nome atualizado com sucesso.");
  });

  it("mostra erros 422 do nome no campo correspondente", async () => {
    server.use(
      http.patch(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          {
            message: "Os dados enviados são inválidos.",
            errors: { name: ["Informe um nome válido."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const session = useSessionStore();
    session.user = verifiedUser;
    session.status = "authenticated";
    const wrapper = mountPage();

    await wrapper.get('form[aria-label="Atualizar nome"]').trigger("submit");
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Informe um nome válido."),
    );
    await flushPromises();

    expect(wrapper.text()).toContain("Informe um nome válido.");
    expect(wrapper.get("#profile-name").attributes("aria-invalid")).toBe(
      "true",
    );
  });

  it("altera a senha com os três campos e limpa os valores após sucesso", async () => {
    let requestBody: unknown;
    let requestMethod = "";
    server.use(
      http.put(PASSWORD_URL, async ({ request }) => {
        requestMethod = request.method;
        requestBody = await request.json();
        return HttpResponse.json(
          { message: "Senha alterada." },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const session = useSessionStore();
    session.user = verifiedUser;
    session.status = "authenticated";
    const wrapper = mountPage();

    await wrapper.get("#current-password").setValue("senha-atual-ficticia");
    await wrapper.get("#new-password").setValue("senha-nova-ficticia-123");
    await wrapper
      .get("#password-confirmation")
      .setValue("senha-nova-ficticia-123");
    await wrapper.get('form[aria-label="Alterar senha"]').trigger("submit");
    await vi.waitFor(() => expect(requestMethod).toBe("PUT"));
    await flushPromises();

    expect(requestMethod).toBe("PUT");
    expect(requestBody).toEqual({
      current_password: "senha-atual-ficticia",
      password: "senha-nova-ficticia-123",
      password_confirmation: "senha-nova-ficticia-123",
    });
    expect(
      wrapper.get<HTMLInputElement>("#current-password").element.value,
    ).toBe("");
    expect(wrapper.get<HTMLInputElement>("#new-password").element.value).toBe(
      "",
    );
    expect(
      wrapper.get<HTMLInputElement>("#password-confirmation").element.value,
    ).toBe("");
    expect(wrapper.text()).toContain("Sua senha foi alterada com sucesso.");
  });

  it("mostra erros 422 da senha nos campos correspondentes", async () => {
    server.use(
      http.put(PASSWORD_URL, ({ request }) =>
        HttpResponse.json(
          {
            message: "Os dados enviados são inválidos.",
            errors: {
              current_password: ["A senha atual está incorreta."],
              password: ["A senha deve ter pelo menos 12 caracteres."],
              password_confirmation: ["A confirmação não confere."],
            },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const session = useSessionStore();
    session.user = verifiedUser;
    session.status = "authenticated";
    const wrapper = mountPage();

    await wrapper.get("#current-password").setValue("senha-atual-ficticia");
    await wrapper.get("#new-password").setValue("senha-nova-ficticia-123");
    await wrapper
      .get("#password-confirmation")
      .setValue("outra-senha-ficticia");
    await wrapper.get('form[aria-label="Alterar senha"]').trigger("submit");
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("A senha atual está incorreta."),
    );
    await flushPromises();

    expect(wrapper.text()).toContain("A senha atual está incorreta.");
    expect(wrapper.text()).toContain(
      "A senha deve ter pelo menos 12 caracteres.",
    );
    expect(wrapper.text()).toContain("A confirmação não confere.");
    expect(wrapper.get("#current-password").attributes("aria-invalid")).toBe(
      "true",
    );
    expect(wrapper.get("#new-password").attributes("aria-invalid")).toBe(
      "true",
    );
    expect(
      wrapper.get("#password-confirmation").attributes("aria-invalid"),
    ).toBe("true");
  });

  it("reenvia os campos da senha submetida ao repetir uma falha temporária", async () => {
    let attempt = 0;
    const requestBodies: unknown[] = [];
    server.use(
      http.put(PASSWORD_URL, async ({ request }) => {
        requestBodies.push(await request.json());
        attempt += 1;
        if (attempt === 1) {
          return HttpResponse.json(
            { message: "Falha temporária." },
            { status: 500, headers: makeCorsHeaders(request) },
          );
        }
        return HttpResponse.json(
          { message: "Senha alterada." },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const session = useSessionStore();
    session.user = verifiedUser;
    session.status = "authenticated";
    const wrapper = mountPage();

    await wrapper.get("#current-password").setValue("senha-atual-ficticia");
    await wrapper.get("#new-password").setValue("senha-nova-ficticia-123");
    await wrapper
      .get("#password-confirmation")
      .setValue("senha-nova-ficticia-123");
    await wrapper.get('form[aria-label="Alterar senha"]').trigger("submit");
    await vi.waitFor(() =>
      expect(
        wrapper.find('button[aria-label="Tentar novamente"]').exists(),
      ).toBe(true),
    );
    await flushPromises();
    await wrapper.get('button[aria-label="Tentar novamente"]').trigger("click");
    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>("#current-password").element.value,
      ).toBe(""),
    );
    await flushPromises();

    const expectedPayload = {
      current_password: "senha-atual-ficticia",
      password: "senha-nova-ficticia-123",
      password_confirmation: "senha-nova-ficticia-123",
    };
    expect(requestBodies).toEqual([expectedPayload, expectedPayload]);
    expect(wrapper.text()).toContain("Operação concluída com sucesso.");
  });
});
