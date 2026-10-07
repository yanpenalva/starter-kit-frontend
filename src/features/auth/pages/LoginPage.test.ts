import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import LoginPage from "./LoginPage.vue";
import { buildHttpError } from "@/lib/http";
import type { MyProfileResource } from "@/lib/api/generated/models";

const mockRouterPush = vi.fn();
let mockQuery: Record<string, string> = {};

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template: "<a><slot /></a>",
  },
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useRoute: () => ({
    query: mockQuery,
  }),
}));

const mockProfile: MyProfileResource = {
  id: 1,
  name: "Maria Silva",
  email: "maria@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: [],
};

describe("LoginPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
    mockQuery = {};
  });

  it("renders email and password inputs and submit button", () => {
    const wrapper = mount(LoginPage);

    expect(wrapper.find("input[type='email']").exists()).toBe(true);
    expect(wrapper.find("input[type='password']").exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").text()).toBe("Entrar");
  });

  it("submits login and redirects to dashboard by default", async () => {
    const session = useSessionStore();
    const loginSpy = vi.spyOn(session, "login").mockResolvedValue(mockProfile);

    const wrapper = mount(LoginPage);
    await wrapper.find("input[type='email']").setValue("maria@example.com");
    await wrapper.find("input[type='password']").setValue("supersecret");
    await wrapper.find("form").trigger("submit.prevent");

    expect(loginSpy).toHaveBeenCalledWith({
      email: "maria@example.com",
      password: "supersecret",
    });
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "dashboard" });
  });

  it("redirects to redirect query param on successful login if valid internal path", async () => {
    mockQuery = { redirect: "/users" };
    const session = useSessionStore();
    vi.spyOn(session, "login").mockResolvedValue(mockProfile);

    const wrapper = mount(LoginPage);
    await wrapper.find("input[type='email']").setValue("maria@example.com");
    await wrapper.find("input[type='password']").setValue("supersecret");
    await wrapper.find("form").trigger("submit.prevent");

    expect(mockRouterPush).toHaveBeenCalledWith("/users");
  });

  it("displays error message on 401 unauthorized", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "login").mockRejectedValue(
      buildHttpError({ kind: "unauthorized", status: 401 }),
    );

    const wrapper = mount(LoginPage);
    await wrapper.find("input[type='email']").setValue("maria@example.com");
    await wrapper.find("input[type='password']").setValue("wrong");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "Credenciais inválidas.",
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("displays error message on 403 forbidden (account blocked)", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "login").mockRejectedValue(
      buildHttpError({ kind: "forbidden", status: 403 }),
    );

    const wrapper = mount(LoginPage);
    await wrapper.find("input[type='email']").setValue("maria@example.com");
    await wrapper.find("input[type='password']").setValue("blocked");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "Esta conta foi desativada.",
    );
  });

  it("renders links to registration and password recovery", () => {
    const wrapper = mount(LoginPage);

    const links = wrapper.findAllComponents({ name: "RouterLink" });
    const targets = links.map((link) => link.props("to"));

    expect(targets).toContain("/register");
    expect(targets).toContain("/forgot-password");
  });

  it("displays success message when arriving with registered=1 query param", () => {
    mockQuery = { registered: "1" };
    const wrapper = mount(LoginPage);

    expect(wrapper.find("[role='status']").text()).toContain(
      "Cadastro realizado com sucesso",
    );
  });

  it("displays success message when arriving with reset=ok query param", () => {
    mockQuery = { reset: "ok" };
    const wrapper = mount(LoginPage);

    expect(wrapper.find("[role='status']").text()).toContain(
      "Senha redefinida com sucesso",
    );
  });

  it("disables submit button and blocks duplicate submits while login is pending", async () => {
    const session = useSessionStore();
    let resolveLogin!: (
      value: Awaited<ReturnType<typeof session.login>>,
    ) => void;
    const pendingLogin = new Promise<Awaited<ReturnType<typeof session.login>>>(
      (resolve) => {
        resolveLogin = resolve;
      },
    );
    const loginSpy = vi.spyOn(session, "login").mockReturnValue(pendingLogin);

    const wrapper = mount(LoginPage);
    await wrapper.find("input[type='email']").setValue("maria@example.com");
    await wrapper.find("input[type='password']").setValue("supersecret");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    const submitButton = wrapper.find("button[type='submit']");
    expect(submitButton.attributes("disabled")).toBeDefined();
    expect(submitButton.text()).toBe("Entrando...");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    expect(loginSpy).toHaveBeenCalledTimes(1);

    resolveLogin(mockProfile);
    await flushPromises();
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "dashboard" });
    wrapper.unmount();
  });
});
