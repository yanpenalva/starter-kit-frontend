import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import BackButton from "./BackButton.vue";

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
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
    const push = vi.spyOn(router, "push");
    const wrapper = mount(BackButton, { global: { plugins: [router] } });

    await wrapper.get("button").trigger("click");

    expect(push).toHaveBeenCalledWith("/");
  });
});
