import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createWebHistory, createRouter } from "vue-router";
import BackButton from "./BackButton.vue";

const createTestRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/detail", component: { template: "<div />" } },
    ],
  });

describe("BackButton.vue", () => {
  it("uses browser history when a previous route exists", async () => {
    const router = createTestRouter();
    await router.push("/");
    await router.push("/detail");
    Object.defineProperty(window.history, "length", {
      configurable: true,
      value: 2,
    });
    const back = vi.spyOn(router, "back");
    const wrapper = mount(BackButton, { global: { plugins: [router] } });

    await wrapper.get("button").trigger("click");

    expect(back).toHaveBeenCalledOnce();
    Object.defineProperty(window.history, "length", {
      configurable: true,
      value: 1,
    });
  });

  it("falls back to the dashboard without history", async () => {
    const router = createTestRouter();
    Object.defineProperty(router.options.history, "state", {
      configurable: true,
      value: { position: 0 },
    });
    const push = vi.spyOn(router, "push");
    const wrapper = mount(BackButton, { global: { plugins: [router] } });

    await wrapper.get("button").trigger("click");

    expect(push).toHaveBeenCalledWith("/");
  });

  it("uses the fallback when browser history exists but router has no prior app route", async () => {
    const router = createTestRouter();
    await router.replace("/detail");
    Object.defineProperty(router.options.history, "state", {
      configurable: true,
      value: { position: 0 },
    });
    Object.defineProperty(window.history, "length", {
      configurable: true,
      value: 3,
    });
    const back = vi.spyOn(router, "back");
    const push = vi.spyOn(router, "push");
    const wrapper = mount(BackButton, { global: { plugins: [router] } });

    await wrapper.get("button").trigger("click");

    expect(back).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
    Object.defineProperty(window.history, "length", {
      configurable: true,
      value: 1,
    });
  });
});
