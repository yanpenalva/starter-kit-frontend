import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InfoTooltip from "./InfoTooltip.vue";

const mountTooltip = (props: Record<string, unknown> = {}) =>
  mount(InfoTooltip, {
    props: {
      text: "Explica o que o campo faz.",
      label: "Ajuda sobre o campo",
      ...props,
    },
    global: {
      stubs: {
        RouterLink: {
          name: "RouterLink",
          props: ["to"],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

describe("InfoTooltip.vue", () => {
  it("hides the bubble until the trigger is used", () => {
    const wrapper = mountTooltip();

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    expect(wrapper.get("button").attributes("aria-label")).toBe(
      "Ajuda sobre o campo",
    );
  });

  it("reveals the bubble on keyboard focus and links it through aria-describedby", async () => {
    const wrapper = mountTooltip();

    await wrapper.get("button").trigger("focus");

    const bubble = wrapper.get('[role="tooltip"]');
    expect(bubble.text()).toContain("Explica o que o campo faz.");
    expect(wrapper.get("button").attributes("aria-describedby")).toBe(
      bubble.attributes("id"),
    );
    expect(wrapper.get("button").attributes("aria-expanded")).toBe("true");
  });

  it("reveals the bubble on pointer hover and hides it again on leave", async () => {
    const wrapper = mountTooltip();

    await wrapper.get("button").trigger("mouseenter");
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true);

    await wrapper.get("button").trigger("mouseleave");
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it("closes the bubble on Escape so keyboard users can dismiss it", async () => {
    const wrapper = mountTooltip();

    await wrapper.get("button").trigger("focus");
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true);

    await wrapper.get("button").trigger("keydown.esc");

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    expect(
      wrapper.get("button").attributes("aria-describedby"),
    ).toBeUndefined();
  });

  it("keeps the bubble reachable by click for touch and assistive technology", async () => {
    const wrapper = mountTooltip();

    await wrapper.get("button").trigger("click");
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true);

    await wrapper.get("button").trigger("click");
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it("omits the manual link unless a destination is provided", async () => {
    const withoutLink = mountTooltip();
    await withoutLink.get("button").trigger("click");
    expect(withoutLink.find("a").exists()).toBe(false);

    const linked = mountTooltip({ to: "/manual#filtros" });
    await linked.get("button").trigger("click");

    expect(linked.get("a").attributes("href")).toBe("/manual#filtros");
    expect(linked.get("a").text()).toBe("Ver no manual");
  });

  it("accepts a custom manual link label", async () => {
    const wrapper = mountTooltip({
      to: "/manual#usuarios",
      linkLabel: "Como gerenciar usuários",
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.get("a").text()).toBe("Como gerenciar usuários");
  });
});
