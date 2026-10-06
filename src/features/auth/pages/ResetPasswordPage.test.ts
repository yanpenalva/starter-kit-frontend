import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "../stores/session";
import ResetPasswordPage from "./ResetPasswordPage.vue";
import { buildHttpError } from "@/lib/http";

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

describe("ResetPasswordPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
    mockQuery = {
      token: "valid-reset-token",
      email: "user@example.com",
    };
  });

  it("shows warning when token or email query parameters are missing", () => {
    mockQuery = {};
    const wrapper = mount(ResetPasswordPage);

    expect(wrapper.find("[role='alert']").text()).toContain(
      "Parâmetros de redefinição ausentes ou inválidos",
    );
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("renders email, password, and confirmation inputs when parameters are present", () => {
    const wrapper = mount(ResetPasswordPage);

    expect(wrapper.find("input[id='reset-email']").exists()).toBe(true);
    expect(
      (wrapper.find("input[id='reset-email']").element as HTMLInputElement)
        .value,
    ).toBe("user@example.com");
    expect(wrapper.find("input[id='reset-password']").exists()).toBe(true);
    expect(
      wrapper.find("input[id='reset-password-confirmation']").exists(),
    ).toBe(true);
    expect(wrapper.find("button[type='submit']").text()).toBe(
      "Redefinir senha",
    );
  });

  it("validates that passwords must match", async () => {
    const session = useSessionStore();
    const resetSpy = vi.spyOn(session, "resetPassword");

    const wrapper = mount(ResetPasswordPage);
    await wrapper
      .find("input[id='reset-password']")
      .setValue("newPassword12345");
    await wrapper
      .find("input[id='reset-password-confirmation']")
      .setValue("differentPassword");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "As senhas não conferem.",
    );
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it("validates that password must have at least 12 characters", async () => {
    const session = useSessionStore();
    const resetSpy = vi.spyOn(session, "resetPassword");

    const wrapper = mount(ResetPasswordPage);
    await wrapper.find("input[id='reset-password']").setValue("short123");
    await wrapper
      .find("input[id='reset-password-confirmation']")
      .setValue("short123");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "A senha deve ter pelo menos 12 caracteres.",
    );
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it("submits valid form and redirects to /login?reset=ok", async () => {
    const session = useSessionStore();
    const resetSpy = vi
      .spyOn(session, "resetPassword")
      .mockResolvedValue({ message: "Senha redefinida com sucesso." });

    const wrapper = mount(ResetPasswordPage);
    await wrapper
      .find("input[id='reset-password']")
      .setValue("newPassword12345");
    await wrapper
      .find("input[id='reset-password-confirmation']")
      .setValue("newPassword12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(resetSpy).toHaveBeenCalledWith({
      token: "valid-reset-token",
      email: "user@example.com",
      password: "newPassword12345",
      password_confirmation: "newPassword12345",
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      name: "login",
      query: { reset: "ok" },
    });
  });

  it("displays validation error on invalid/expired token 422", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "resetPassword").mockRejectedValue(
      buildHttpError({
        kind: "validation",
        status: 422,
        body: {
          message: "Este token de redefinição de senha é inválido.",
          errors: { email: ["Este token de redefinição de senha é inválido."] },
        },
      }),
    );

    const wrapper = mount(ResetPasswordPage);
    await wrapper
      .find("input[id='reset-password']")
      .setValue("newPassword12345");
    await wrapper
      .find("input[id='reset-password-confirmation']")
      .setValue("newPassword12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "Este token de redefinição de senha é inválido.",
    );
  });
});
