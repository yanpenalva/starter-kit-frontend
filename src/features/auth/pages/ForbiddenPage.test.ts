import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "../stores/session";
import ForbiddenPage from "./ForbiddenPage.vue";

let mockQuery: Record<string, string> = {};

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template: "<a><slot /></a>",
  },
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    query: mockQuery,
  }),
}));

describe("ForbiddenPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockQuery = {};
  });

  it("renders standard 403 forbidden state", () => {
    const wrapper = mount(ForbiddenPage);

    expect(wrapper.get("h1").text()).toBe("Acesso Negado");
    expect(wrapper.text()).toContain("Você não tem permissão");
    expect(wrapper.text()).toContain("Ir para o Painel");
  });

  it("renders blocked 403 state when reason is blocked", () => {
    mockQuery = { reason: "blocked" };
    const wrapper = mount(ForbiddenPage);

    expect(wrapper.get("h1").text()).toBe("Conta Desativada");
    expect(wrapper.text()).toContain("Esta conta foi desativada.");
    expect(wrapper.find("button").text()).toBe("Encerrar sessão");
  });

  it("renders blocked 403 state when session isBlocked is true", () => {
    const session = useSessionStore();
    session.status = "blocked";

    const wrapper = mount(ForbiddenPage);

    expect(wrapper.get("h1").text()).toBe("Conta Desativada");
    expect(wrapper.text()).toContain("Esta conta foi desativada.");
  });
});
