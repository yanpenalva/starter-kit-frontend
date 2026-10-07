import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import ForgotPasswordPage from "./ForgotPasswordPage.vue";
import { buildHttpError } from "@/lib/http";

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template: "<a><slot /></a>",
  },
}));

describe("ForgotPasswordPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders email input, submit button, and login link", () => {
    const wrapper = mount(ForgotPasswordPage);

    expect(wrapper.find("input[type='email']").exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").text()).toBe(
      "Enviar instruções",
    );
  });

  it("submits email and displays neutral message anti-enumeration", async () => {
    const session = useSessionStore();
    const forgotSpy = vi
      .spyOn(session, "forgotPassword")
      .mockResolvedValue({ message: "Se o email existir, enviamos o link." });

    const wrapper = mount(ForgotPasswordPage);
    await wrapper.find("input[type='email']").setValue("unknown@example.com");
    await wrapper.find("form").trigger("submit.prevent");

    expect(forgotSpy).toHaveBeenCalledWith({ email: "unknown@example.com" });
    expect(wrapper.find("[role='status']").text()).toBe(
      "Se o email existir, enviamos o link.",
    );
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("handles 429 rate limit error with Retry-After", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "forgotPassword").mockRejectedValue(
      buildHttpError({
        kind: "rate_limited",
        status: 429,
        retryAfterHeader: "30",
      }),
    );

    const wrapper = mount(ForgotPasswordPage);
    await wrapper.find("input[type='email']").setValue("user@example.com");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toContain(
      "Muitas tentativas",
    );
    expect(wrapper.find("[role='alert']").text()).toContain("30 segundos");
  });

  it("handles 422 validation error", async () => {
    const session = useSessionStore();
    vi.spyOn(session, "forgotPassword").mockRejectedValue(
      buildHttpError({
        kind: "validation",
        status: 422,
        body: {
          message: "O campo email é inválido.",
          errors: { email: ["O campo email é inválido."] },
        },
      }),
    );

    const wrapper = mount(ForgotPasswordPage);
    await wrapper.find("input[type='email']").setValue("not-an-email");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find("[role='alert']").text()).toBe(
      "Informe um endereço de e-mail válido.",
    );
  });

  it("disables submit button and blocks duplicate submits while request is pending", async () => {
    const session = useSessionStore();
    let resolveForgot!: (
      value: Awaited<ReturnType<typeof session.forgotPassword>>,
    ) => void;
    const pendingForgot = new Promise<
      Awaited<ReturnType<typeof session.forgotPassword>>
    >((resolve) => {
      resolveForgot = resolve;
    });
    const forgotSpy = vi
      .spyOn(session, "forgotPassword")
      .mockReturnValue(pendingForgot);

    const wrapper = mount(ForgotPasswordPage);
    await wrapper.find("input[type='email']").setValue("user@example.com");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    const submitButton = wrapper.find("button[type='submit']");
    expect(submitButton.attributes("disabled")).toBeDefined();
    expect(submitButton.text()).toBe("Enviando...");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    expect(forgotSpy).toHaveBeenCalledTimes(1);

    resolveForgot({ message: "Se o email existir, enviamos o link." });
    await flushPromises();
    expect(wrapper.find("[role='status']").text()).toBe(
      "Se o email existir, enviamos o link.",
    );
    wrapper.unmount();
  });
});
