import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "../stores/session";
import LimitedPage from "./LimitedPage.vue";
import { buildHttpError } from "@/lib/http";
import type { MyProfileResource } from "@/lib/api/generated/models";

const mockRouterPush = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

const mockLimitedUser: MyProfileResource = {
  id: 42,
  name: "João Silva",
  email: "joao@example.com",
  email_verified_at: null,
  roles: [],
  permissions: [],
};

describe("LimitedPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
  });

  it("renders pending email verification guidance with user email", () => {
    const session = useSessionStore();
    session.user = mockLimitedUser;
    session.status = "limited";

    const wrapper = mount(LimitedPage);

    expect(wrapper.get("h1").text()).toBe("Verificação de E-mail Pendente");
    expect(wrapper.text()).toContain("joao@example.com");
    expect(wrapper.text()).toContain("SESSÃO LIMITADA");
  });

  it("checks status on click and redirects to dashboard if verified", async () => {
    const session = useSessionStore();
    session.user = mockLimitedUser;
    session.status = "limited";

    const verifiedUser: MyProfileResource = {
      ...mockLimitedUser,
      email_verified_at: "2026-10-01T12:00:00Z",
    };
    vi.spyOn(session, "bootstrap").mockResolvedValue(verifiedUser);

    const wrapper = mount(LimitedPage);
    await wrapper.find(".limited-btn--primary").trigger("click");

    expect(mockRouterPush).toHaveBeenCalledWith({ name: "dashboard" });
  });

  it("triggers logout when clicking logout button", async () => {
    const session = useSessionStore();
    session.user = mockLimitedUser;
    session.status = "limited";
    const logoutSpy = vi.spyOn(session, "logout").mockResolvedValue(undefined);

    const wrapper = mount(LimitedPage);
    await wrapper.find(".limited-btn--secondary").trigger("click");

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "login" });
  });

  it("triggers resend verification on button click and displays success message", async () => {
    const session = useSessionStore();
    session.user = mockLimitedUser;
    session.status = "limited";
    const resendSpy = vi
      .spyOn(session, "resendVerification")
      .mockResolvedValue({ message: "Link de verificação reenviado." });

    const wrapper = mount(LimitedPage);
    const resendBtn = wrapper.find(".limited-btn--outline");
    expect(resendBtn.exists()).toBe(true);
    expect(resendBtn.text()).toBe("Reenviar e-mail");

    await resendBtn.trigger("click");

    expect(resendSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.find("[role='status']").text()).toBe(
      "Link de verificação reenviado.",
    );
  });

  it("handles 429 rate limit on resend verification with Retry-After", async () => {
    const session = useSessionStore();
    session.user = mockLimitedUser;
    session.status = "limited";
    vi.spyOn(session, "resendVerification").mockRejectedValue(
      buildHttpError({
        kind: "rate_limited",
        status: 429,
        retryAfterHeader: "60",
      }),
    );

    const wrapper = mount(LimitedPage);
    await wrapper.find(".limited-btn--outline").trigger("click");

    expect(wrapper.find("[role='alert']").text()).toContain(
      "Muitas tentativas",
    );
    expect(wrapper.find("[role='alert']").text()).toContain("60 segundos");
  });
});
