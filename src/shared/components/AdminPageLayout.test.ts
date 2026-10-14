import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import BackButton from "./BackButton.vue";
import AdminPageLayout from "./AdminPageLayout.vue";

const makeRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", name: "home", component: { template: "<div />" } }],
  });
  await router.push("/");
  await router.isReady();
  return router;
};

const mountLayout = async (props: Record<string, unknown> = {}) =>
  mount(AdminPageLayout, {
    props: { eyebrow: "ADMINISTRAÇÃO", title: "Título", ...props },
    slots: { default: '<p data-test="slot-content">Conteúdo</p>' },
    global: {
      plugins: [await makeRouter()],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });

describe("AdminPageLayout", () => {
  it("não renderiza voltar sem back-fallback", async () => {
    const wrapper = await mountLayout();

    expect(wrapper.find(".back-button").exists()).toBe(false);
    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(true);
  });

  it("renderiza o voltar acima do cabeçalho com o fallback informado", async () => {
    const wrapper = await mountLayout({ backFallback: "/users" });
    const backButton = wrapper.findComponent(BackButton);

    expect(backButton.exists()).toBe(true);
    expect(backButton.props("fallback")).toBe("/users");
    const html = wrapper.html();
    expect(html.indexOf("back-button")).toBeLessThan(
      html.indexOf("page-header"),
    );
  });
});
