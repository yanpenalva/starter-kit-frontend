import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import App from "./App.vue";

interface Harness {
  readonly router: Router;
  readonly mounts: string[];
  readonly unmounts: string[];
}

const createHarness = (): Harness => {
  const mounts: string[] = [];
  const unmounts: string[] = [];
  const page = (name: string) =>
    defineComponent({
      name: `Page${name}`,
      setup() {
        mounts.push(name);
        return () => h("section", { class: `page-${name}` }, `Página ${name}`);
      },
      unmounted() {
        unmounts.push(name);
      },
    });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", redirect: { name: "dashboard" } },
      { path: "/dashboard", name: "dashboard", component: page("dashboard") },
      { path: "/logs", name: "logs", component: page("logs") },
    ],
  });
  return { router, mounts, unmounts };
};

const mountApp = async (router: Router): Promise<VueWrapper> => {
  const wrapper = mount(App, {
    global: { plugins: [router], stubs: { transition: false } },
  });
  await router.isReady();
  await vi.waitFor(() =>
    expect(wrapper.find(".page-dashboard").exists()).toBe(true),
  );
  return wrapper;
};

const countMounts = (mounts: string[], name: string): number =>
  mounts.filter((entry) => entry === name).length;

describe("App.vue", () => {
  it("renderiza a página dentro de uma raiz estável de transição", async () => {
    const { router } = createHarness();
    const wrapper = await mountApp(router);

    const root = wrapper.get(".route-view");
    expect(root.element.tagName).toBe("DIV");
    expect(wrapper.element).toBe(root.element);
    expect(root.find(".page-dashboard").exists()).toBe(true);
  });

  it("não remonta a página quando só a query ou o hash mudam", async () => {
    const { router, mounts } = createHarness();
    const wrapper = await mountApp(router);

    await router.push("/dashboard?tab=papeis");
    await flushPromises();
    await router.push("/dashboard?tab=logs#topo");
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe("/dashboard?tab=logs#topo");
    expect(countMounts(mounts, "dashboard")).toBe(1);
    expect(wrapper.find(".page-dashboard").exists()).toBe(true);
  });

  it("troca a página por path e desmonta a anterior, sem KeepAlive", async () => {
    const { router, mounts, unmounts } = createHarness();
    const wrapper = await mountApp(router);

    await router.push("/logs");
    await vi.waitFor(() =>
      expect(wrapper.find(".page-logs").exists()).toBe(true),
    );
    await vi.waitFor(() =>
      expect(wrapper.find(".page-dashboard").exists()).toBe(false),
    );

    expect(countMounts(mounts, "logs")).toBe(1);
    expect(unmounts).toContain("dashboard");
  });
});
