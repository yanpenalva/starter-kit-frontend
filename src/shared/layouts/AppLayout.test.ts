import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import type { Router } from "vue-router";
import { useSessionStore } from "@/features/auth/stores/session";
import AppLayout from "./AppLayout.vue";
import type { MyProfileResource } from "@/lib/api/generated/models";

const DESKTOP_WIDTH = 1440;
const MOBILE_WIDTH = 390;

const adminUser: MyProfileResource = {
  id: 1,
  name: "Maria Admin",
  email: "admin@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "roles.view", "logs.view"],
};

const makeRouter = async (path: string): Promise<Router> => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      { path: "/login", name: "login", component: { template: "<div />" } },
      {
        path: "/dashboard",
        name: "dashboard",
        component: { template: "<div />" },
      },
      { path: "/users", name: "users", component: { template: "<div />" } },
      {
        path: "/users/:userId",
        name: "user-detail",
        component: { template: "<div />" },
      },
      { path: "/roles", name: "roles", component: { template: "<div />" } },
      { path: "/logs", name: "logs", component: { template: "<div />" } },
      { path: "/manual", name: "manual", component: { template: "<div />" } },
    ],
  });
  await router.push(path);
  await router.isReady();
  return router;
};

const mountLayout = async (
  path = "/dashboard",
  width = DESKTOP_WIDTH,
): Promise<{ wrapper: VueWrapper; router: Router }> => {
  window.innerWidth = width;
  const router = await makeRouter(path);
  const wrapper = mount(AppLayout, {
    global: { plugins: [router] },
    slots: { default: '<p class="slot-probe">conteúdo da página</p>' },
  });
  await flush();
  mountedLayouts.push(wrapper);
  return { wrapper, router };
};

const flush = async (): Promise<void> => {
  await nextTick();
  await nextTick();
};

const mountedLayouts: VueWrapper[] = [];

const resizeTo = async (width: number): Promise<void> => {
  window.innerWidth = width;
  window.dispatchEvent(new Event("resize"));
  await flush();
};

const toggle = (wrapper: VueWrapper) => wrapper.get(".app-header__toggle");
const drawer = (wrapper: VueWrapper) => wrapper.get(".q-drawer");

const overlayBackdrop = (wrapper: VueWrapper): string[] => {
  const backdrop = wrapper.find(".q-drawer__backdrop");
  return backdrop.exists() ? backdrop.classes() : [];
};

describe("AppLayout.vue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = adminUser;
  });

  afterEach(() => {
    while (mountedLayouts.length > 0) {
      mountedLayouts.pop()?.unmount();
    }
    vi.useRealTimers();
  });

  it("mounts a single shell with header, drawer and the app content container", async () => {
    const { wrapper } = await mountLayout();

    expect(wrapper.findAll(".q-layout")).toHaveLength(1);
    expect(wrapper.find(".q-header").exists()).toBe(true);
    expect(wrapper.find(".app-header__toggle").exists()).toBe(true);
    expect(wrapper.find(".q-drawer").exists()).toBe(true);

    const content = wrapper.get("#app-content");
    expect(content.find(".slot-probe").text()).toBe("conteúdo da página");

    expect(wrapper.findAll("#app-navigation")).toHaveLength(1);
    expect(wrapper.findAll(".app-navigation__links")).toHaveLength(1);
    expect(wrapper.find(".q-drawer #app-navigation").exists()).toBe(true);
    expect(wrapper.find(".q-header #app-navigation").exists()).toBe(false);
  });

  it("keeps the drawer expanded on desktop and toggles the mini state by click and keyboard", async () => {
    const { wrapper } = await mountLayout();

    expect(drawer(wrapper).classes()).toContain("q-drawer--standard");
    expect(toggle(wrapper).attributes("type")).toBe("button");
    expect(toggle(wrapper).attributes("aria-controls")).toBe("app-navigation");
    expect(toggle(wrapper).attributes("aria-expanded")).toBe("true");
    expect(toggle(wrapper).attributes("aria-label")).toBe(
      "Recolher menu de navegação",
    );

    await toggle(wrapper).trigger("click");
    await flush();

    expect(drawer(wrapper).classes()).toContain("q-drawer--mini");
    expect(toggle(wrapper).attributes("aria-expanded")).toBe("false");
    expect(toggle(wrapper).attributes("aria-label")).toBe(
      "Expandir menu de navegação",
    );

    const link = wrapper.get(".app-navigation__link");
    expect(link.element.tagName).toBe("A");
    expect(link.attributes("href")).toBe("/dashboard");
    expect(link.attributes("title")).toBe("Início");
    expect(wrapper.get(".app-navigation__label").text()).toBe("Início");

    await toggle(wrapper).trigger("click");
    await flush();

    expect(drawer(wrapper).classes()).not.toContain("q-drawer--mini");
    expect(toggle(wrapper).attributes("aria-expanded")).toBe("true");
  });

  it("closes the mobile overlay after navigating", async () => {
    const { wrapper, router } = await mountLayout("/dashboard", MOBILE_WIDTH);

    expect(drawer(wrapper).classes()).toContain("q-drawer--mobile");
    expect(drawer(wrapper).classes()).not.toContain("q-drawer--mini");
    expect(overlayBackdrop(wrapper)).toContain("hidden");
    expect(toggle(wrapper).attributes("aria-expanded")).toBe("false");
    expect(toggle(wrapper).attributes("aria-label")).toBe(
      "Abrir menu de navegação",
    );

    await toggle(wrapper).trigger("click");
    await flush();

    expect(toggle(wrapper).attributes("aria-expanded")).toBe("true");
    expect(toggle(wrapper).attributes("aria-label")).toBe(
      "Fechar menu de navegação",
    );
    expect(overlayBackdrop(wrapper)).not.toContain("hidden");

    await router.push("/users");
    await flush();

    expect(wrapper.find("#app-content").exists()).toBe(true);
    expect(overlayBackdrop(wrapper)).toContain("hidden");
    expect(toggle(wrapper).attributes("aria-expanded")).toBe("false");
  });

  it("restores the desktop mini state and ignores it on mobile", async () => {
    const { wrapper } = await mountLayout();

    await toggle(wrapper).trigger("click");
    await flush();
    expect(drawer(wrapper).classes()).toContain("q-drawer--mini");

    await resizeTo(MOBILE_WIDTH);

    expect(drawer(wrapper).classes()).toContain("q-drawer--mobile");
    expect(drawer(wrapper).classes()).not.toContain("q-drawer--mini");
    expect(overlayBackdrop(wrapper)).toContain("hidden");

    await toggle(wrapper).trigger("click");
    await flush();
    expect(overlayBackdrop(wrapper)).not.toContain("hidden");

    await resizeTo(DESKTOP_WIDTH);
    expect(drawer(wrapper).classes()).not.toContain("q-drawer--mobile");
    expect(drawer(wrapper).classes()).toContain("q-drawer--mini");

    expect(overlayBackdrop(wrapper)).toEqual([]);
  });

  it("highlights the sidebar item of the current section, including the user detail route", async () => {
    const { wrapper } = await mountLayout("/users/7");

    const active = wrapper.findAll(".app-navigation__link--active");
    expect(active).toHaveLength(1);
    expect(active[0]?.get(".app-navigation__label").text().trim()).toBe(
      "Usuários",
    );
    expect(wrapper.get(".app-header__context").text()).toBe("Usuários");
  });
});
