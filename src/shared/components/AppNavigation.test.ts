import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import AppNavigation from "./AppNavigation.vue";
import type { MyProfileResource } from "@/lib/api/generated/models";

const { routeState, mockRouterPush } = vi.hoisted(() => ({
  routeState: { path: "/dashboard" },
  mockRouterPush: vi.fn(),
}));

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template:
      "<a :href=\"typeof to === 'string' ? to : to.path || to.name\"><slot /></a>",
  },
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useRoute: () => ({
    path: routeState.path,
  }),
}));

const adminUser: MyProfileResource = {
  id: 1,
  name: "Maria Admin",
  email: "admin@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "roles.view", "logs.view"],
};

const authenticate = (user: MyProfileResource = adminUser): void => {
  const session = useSessionStore();
  session.status = "authenticated";
  session.user = user;
};

const labelsOf = (wrapper: VueWrapper): string[] =>
  wrapper.findAll(".app-navigation__label").map((label) => label.text().trim());

describe("AppNavigation.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
    routeState.path = "/dashboard";
  });

  it("renders public view with login link when unauthenticated", () => {
    const session = useSessionStore();
    session.status = "unauthenticated";
    session.user = null;

    const wrapper = mount(AppNavigation);

    expect(wrapper.find(".app-navigation__login-link").exists()).toBe(true);
    expect(wrapper.find(".app-navigation__logout-btn").exists()).toBe(false);
    expect(wrapper.text()).toContain("Início");
    expect(wrapper.text()).not.toContain("Painel");
  });

  it("renders authenticated navigation with role and permitted links", () => {
    authenticate();

    const wrapper = mount(AppNavigation);

    expect(wrapper.find(".app-navigation__login-link").exists()).toBe(false);
    expect(wrapper.find(".app-navigation__logout-btn").exists()).toBe(true);
    expect(wrapper.text()).toContain("Maria Admin");
    expect(wrapper.text()).toContain("admin");
    expect(wrapper.text()).toContain("Painel");
    expect(wrapper.text()).toContain("Usuários");
    expect(wrapper.text()).toContain("Papéis");
    expect(wrapper.text()).toContain("Auditoria");
    expect(wrapper.text()).toContain("Manual");
  });

  it("renders the side navigation as a labelled list of reachable links", () => {
    authenticate();

    const wrapper = mount(AppNavigation);

    const nav = wrapper.get("nav#app-navigation");
    expect(nav.attributes("aria-label")).toBe("Navegação principal");
    expect(wrapper.findAll("nav#app-navigation")).toHaveLength(1);

    const links = wrapper.findAll(".app-navigation__link");
    const labels = labelsOf(wrapper);
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.element.tagName).toBe("A");
      expect(link.attributes("href")).toBeTruthy();
    });

    expect(labels).toEqual([
      "Início",
      "Painel",
      "Sessões",
      "Minha Conta",
      "Usuários",
      "Papéis",
      "Auditoria",
      "Manual",
    ]);
    expect(links.map((link) => link.attributes("href"))).toEqual([
      "/",
      "/dashboard",
      "/sessions",
      "/profile",
      "/users",
      "/roles",
      "/logs",
      "/manual",
    ]);

    const icons = wrapper.findAll(".app-navigation__icon");
    expect(icons).toHaveLength(links.length);
    icons.forEach((icon) => {
      expect(icon.attributes("aria-hidden")).toBe("true");
      expect(icon.text().trim().length).toBeGreaterThan(0);
    });
  });

  it("marks the active route, including the user detail route", () => {
    authenticate();
    routeState.path = "/users/7";

    const wrapper = mount(AppNavigation);

    const activeLinks = wrapper
      .findAll(".app-navigation__link--active")
      .map((link) => link.get(".app-navigation__label").text().trim());

    expect(activeLinks).toEqual(["Usuários"]);
  });

  it("keeps labels and tooltips available in the mini state", () => {
    authenticate();

    const wrapper = mount(AppNavigation, { props: { mini: true } });

    const links = wrapper.findAll(".app-navigation__link");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.classes()).toContain("app-navigation__link--mini");
      expect(link.attributes("title")).toBe(
        link.get(".app-navigation__label").text().trim(),
      );
      expect(link.element.tagName).toBe("A");
    });

    const labels = wrapper.findAll(".app-navigation__label");
    expect(labels.map((label) => label.text()).join(" ")).toContain("Usuários");

    expect(wrapper.get(".app-navigation__user").classes()).toContain(
      "app-navigation__user--mini",
    );
    expect(wrapper.get(".app-navigation__user-name").text()).toBe(
      "Maria Admin",
    );
    expect(wrapper.get(".app-navigation__logout-btn").classes()).toContain(
      "app-navigation__logout-btn--mini",
    );
    expect(wrapper.get(".app-navigation__logout-label").text()).toBe("Sair");
  });

  it("calls session.logout and navigates to login when clicking logout", async () => {
    authenticate();
    const session = useSessionStore();
    const logoutSpy = vi.spyOn(session, "logout").mockResolvedValue(undefined);

    const wrapper = mount(AppNavigation);

    await wrapper.find(".app-navigation__logout-btn").trigger("click");

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "login" });
  });

  it("clears session, navigates to login and shows feedback when logout fails", async () => {
    authenticate();
    const session = useSessionStore();
    vi.spyOn(session, "logout").mockImplementation(async () => {
      session.clearSession();
      throw new Error("Offline");
    });

    const wrapper = mount(AppNavigation);

    await wrapper.find(".app-navigation__logout-btn").trigger("click");
    await wrapper.vm.$nextTick();

    expect(session.user).toBeNull();
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "login" });
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Não foi possível concluir a solicitação de saída.",
    );
  });
});
