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
      { path: "/", component: { template: "<div />" } },
      { path: "/login", component: { template: "<div />" } },
      { path: "/profile", component: { template: "<div />" } },
      { path: "/manual", component: { template: "<div />" } },
      { path: "/dashboard", component: { template: "<div />" } },
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

  it("welcomes the user and presents the project value without a permission matrix", async () => {
    useSessionStore().user = makeUser();
    const wrapper = await mountPage();

    expect(wrapper.get("h1").text()).toBe("Olá, Maria!");
    expect(wrapper.text()).toContain("organizar contas e perfis");
    expect(wrapper.text()).toContain("Minha Conta");
    expect(wrapper.text()).toContain("Consultar o Manual");
    expect(wrapper.text()).not.toContain("Permissões ativas");
    expect(wrapper.text()).not.toContain("Perfil da Conta");
    expect(wrapper.text()).not.toContain("users.view");
  });

  it("exposes the profiles shortcut to holders of roles.view without an admin profile", async () => {
    useSessionStore().user = makeUser({
      permissions: ["roles.view", "logs.view"],
    });
    const wrapper = await mountPage();

    const links = wrapper.findAll(".dashboard-action-btn");
    expect(links.map((link) => link.text())).toContain("Gerenciar Perfis");
    expect(wrapper.text()).not.toContain("Gerenciar Usuários");
    expect(wrapper.text()).toContain("Olá, Maria!");
    expect(wrapper.text()).not.toContain("roles.view");
  });

  it("hides the profiles shortcut without roles.view and without an admin profile", async () => {
    useSessionStore().user = makeUser({ permissions: ["logs.view"] });
    const wrapper = await mountPage();

    const links = wrapper.findAll(".dashboard-action-btn");
    expect(links.map((link) => link.text())).not.toContain("Gerenciar Perfis");
    expect(links.map((link) => link.text())).toContain("Ver Logs de Auditoria");
  });

  it("keeps the profiles shortcut for admins", async () => {
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
        { text: "Minha Conta", href: "/profile" },
        { text: "Consultar o Manual", href: "/manual" },
      ]),
    );
  });

  it("keeps the account and Manual shortcuts without admin shortcuts", async () => {
    useSessionStore().user = makeUser({});
    const wrapper = await mountPage();

    const links = wrapper.findAll(".dashboard-action-btn");
    expect(links.map((link) => link.attributes("href"))).toEqual([
      "/profile",
      "/manual",
    ]);
  });
});
