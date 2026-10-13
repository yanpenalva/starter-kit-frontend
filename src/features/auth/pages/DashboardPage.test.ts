import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import type { MyProfileResource } from "@/lib/api/generated/models";
import { useSessionStore } from "@/features/auth/stores/session";
import DashboardPage from "./DashboardPage.vue";

const makeRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/users", name: "users", component: { template: "<div />" } },
      { path: "/roles", name: "roles", component: { template: "<div />" } },
      { path: "/logs", name: "logs", component: { template: "<div />" } },
    ],
  });
  await router.push("/");
  await router.isReady();
  return router;
};

const makeUser = (
  overrides: Partial<MyProfileResource> = {},
): MyProfileResource => ({
  id: 1,
  name: "Maria",
  email: "maria@example.test",
  email_verified_at: "2026-01-01T00:00:00Z",
  roles: ["member"],
  permissions: [],
  ...overrides,
});

const mountPage = async () => {
  const router = await makeRouter();
  return mount(DashboardPage, {
    global: { plugins: [router] },
  });
};

describe("DashboardPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("expõe o atalho de perfis para quem tem roles.view, sem perfil admin", async () => {
    useSessionStore().user = makeUser({
      permissions: ["roles.view", "logs.view"],
    });
    const wrapper = await mountPage();

    const links = wrapper.findAll(".dashboard-action-btn");
    expect(links.map((link) => link.text())).toContain("Gerenciar Perfis");
    expect(wrapper.text()).not.toContain("Gerenciar Usuários");
    expect(wrapper.text()).toContain("Ver perfis");
    expect(wrapper.text()).not.toContain("roles.view");
  });

  it("não expõe o atalho de perfis sem roles.view e sem perfil admin", async () => {
    useSessionStore().user = makeUser({ permissions: ["logs.view"] });
    const wrapper = await mountPage();

    const links = wrapper.findAll(".dashboard-action-btn");
    expect(links.map((link) => link.text())).not.toContain("Gerenciar Perfis");
    expect(links.map((link) => link.text())).toContain("Ver Logs de Auditoria");
  });

  it("mantém o atalho de perfis para o admin", async () => {
    useSessionStore().user = makeUser({
      roles: ["admin"],
      permissions: ["users.view", "roles.view", "logs.view"],
    });
    const wrapper = await mountPage();

    const links = wrapper.findAll(".dashboard-action-btn").map((link) => ({
      text: link.text(),
      href: link.attributes("href"),
    }));
    expect(links).toEqual(
      expect.arrayContaining([
        { text: "Gerenciar Usuários", href: "/users" },
        { text: "Gerenciar Perfis", href: "/roles" },
        { text: "Ver Logs de Auditoria", href: "/logs" },
      ]),
    );
  });

  it("mostra mensagem de vazio quando nenhum atalho é permitido", async () => {
    useSessionStore().user = makeUser({});
    const wrapper = await mountPage();

    expect(wrapper.findAll(".dashboard-action-btn")).toHaveLength(0);
    expect(wrapper.text()).toContain(
      "Nenhum atalho administrativo adicional configurado para seu perfil.",
    );
  });
});
