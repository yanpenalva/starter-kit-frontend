import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import AppNavigation from "./AppNavigation.vue";
import type { MyProfileResource } from "@/lib/api/generated/models";

const mockRouterPush = vi.fn();

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
    path: "/dashboard",
  }),
}));

const adminUser: MyProfileResource = {
  id: 1,
  name: "Maria Admin",
  email: "admin@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "logs.view"],
};

describe("AppNavigation.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
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
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = adminUser;

    const wrapper = mount(AppNavigation);

    expect(wrapper.find(".app-navigation__login-link").exists()).toBe(false);
    expect(wrapper.find(".app-navigation__logout-btn").exists()).toBe(true);
    expect(wrapper.text()).toContain("Maria Admin");
    expect(wrapper.text()).toContain("admin");
    expect(wrapper.text()).toContain("Painel");
    expect(wrapper.text()).toContain("Usuários");
    expect(wrapper.text()).toContain("Papéis");
    expect(wrapper.text()).toContain("Auditoria");
  });

  it("calls session.logout and navigates to login when clicking logout", async () => {
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = adminUser;
    const logoutSpy = vi.spyOn(session, "logout").mockResolvedValue(undefined);

    const wrapper = mount(AppNavigation);

    await wrapper.find(".app-navigation__logout-btn").trigger("click");

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "login" });
  });
});
