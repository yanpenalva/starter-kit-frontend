import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "../stores/session";
import RegisterPage from "./RegisterPage.vue";
import { buildHttpError } from "@/lib/http";

const mockRouterPush = vi.fn();

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template: "<a><slot /></a>",
  },
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

describe("RegisterPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
  });

  it("renders all registration inputs, submit button, and login link", () => {
    const wrapper = mount(RegisterPage);

    expect(wrapper.find("input[id='register-name']").exists()).toBe(true);
    expect(wrapper.find("input[id='register-email']").exists()).toBe(true);
    expect(wrapper.find("input[id='register-cpf']").exists()).toBe(true);
    expect(wrapper.find("input[id='register-password']").exists()).toBe(true);
    expect(
      wrapper.find("input[id='register-password-confirmation']").exists(),
    ).toBe(true);
    expect(wrapper.find("button[type='submit']").text()).toBe("Criar conta");
  });

  it("validates that password and confirmation must match", async () => {
    const session = useSessionStore();
    const registerSpy = vi.spyOn(session, "register");

    const wrapper = mount(RegisterPage);
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("carlos@example.com");
    await wrapper
      .find("input[id='register-password']")
      .setValue("password12345");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("differentPassword");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "As senhas não conferem.",
    );
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("validates that password must have at least 12 characters", async () => {
    const session = useSessionStore();
    const registerSpy = vi.spyOn(session, "register");

    const wrapper = mount(RegisterPage);
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("carlos@example.com");
    await wrapper.find("input[id='register-password']").setValue("short123");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("short123");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "A senha deve ter pelo menos 12 caracteres.",
    );
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("validates CPF check digits if CPF is provided", async () => {
    const session = useSessionStore();
    const registerSpy = vi.spyOn(session, "register");

    const wrapper = mount(RegisterPage);
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("carlos@example.com");
    await wrapper.find("input[id='register-cpf']").setValue("11111111111");
    await wrapper
      .find("input[id='register-password']")
      .setValue("password12345");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("password12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "Os dígitos verificadores do campo cpf são inválidos.",
    );
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("submits valid form and redirects to /login?registered=1", async () => {
    const session = useSessionStore();
    const registerSpy = vi.spyOn(session, "register").mockResolvedValue({
      id: 20,
      name: "Carlos",
      email: "carlos@example.com",
      email_verified_at: null,
    });

    const wrapper = mount(RegisterPage);
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("carlos@example.com");
    await wrapper.find("input[id='register-cpf']").setValue("529.982.247-25");
    await wrapper
      .find("input[id='register-password']")
      .setValue("password12345");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("password12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(registerSpy).toHaveBeenCalledWith({
      name: "Carlos",
      email: "carlos@example.com",
      password: "password12345",
      password_confirmation: "password12345",
      cpf: "52998224725",
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      name: "login",
      query: { registered: "1" },
    });
  });

  it("displays validation error when backend returns 422", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "register").mockRejectedValue(
      buildHttpError({
        kind: "validation",
        status: 422,
        body: {
          message: "O campo email já está em uso.",
          errors: { email: ["O campo email já está em uso."] },
        },
      }),
    );

    const wrapper = mount(RegisterPage);
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("duplicate@example.com");
    await wrapper
      .find("input[id='register-password']")
      .setValue("password12345");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("password12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "O campo email já está em uso.",
    );
    expect(wrapper.find(".register-form__field-error").text()).toBe(
      "O campo email já está em uso.",
    );
    expect(wrapper.find("#register-email").attributes("aria-invalid")).toBe(
      "true",
    );
    expect(wrapper.find("#register-email").attributes("aria-describedby")).toBe(
      "register-email-error",
    );
    expect(wrapper.find("#register-email-error").exists()).toBe(true);
    wrapper.unmount();
  });

  it("focuses the first invalid field in form order after validation failure", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "register").mockRejectedValue(
      buildHttpError({
        kind: "validation",
        status: 422,
        body: {
          message: "Dados inválidos.",
          errors: {
            password_confirmation: ["A confirmação não confere."],
            email: ["E-mail já está em uso."],
          },
        },
      }),
    );

    const wrapper = mount(RegisterPage, { attachTo: document.body });
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("duplicate@example.com");
    await wrapper
      .find("input[id='register-password']")
      .setValue("password12345");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("password12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(document.activeElement).toBe(
      wrapper.find("#register-email").element,
    );
    expect(
      wrapper
        .find("#register-password-confirmation")
        .attributes("aria-describedby"),
    ).toBe("register-password-confirmation-error");
    wrapper.unmount();
  });

  it("displays rate limit message when backend returns 429", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "register").mockRejectedValue(
      buildHttpError({
        kind: "rate_limited",
        status: 429,
        retryAfterHeader: "60",
      }),
    );

    const wrapper = mount(RegisterPage);
    await wrapper.find("input[id='register-name']").setValue("Carlos");
    await wrapper
      .find("input[id='register-email']")
      .setValue("carlos@example.com");
    await wrapper
      .find("input[id='register-password']")
      .setValue("password12345");
    await wrapper
      .find("input[id='register-password-confirmation']")
      .setValue("password12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toContain(
      "Muitas tentativas",
    );
  });
});
