import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import VerifyEmailPage from "./VerifyEmailPage.vue";
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

const mockVerifiedProfile: MyProfileResource = {
  id: 1,
  name: "Maria Silva",
  email: "maria@example.com",
  email_verified_at: "2026-10-06T12:00:00Z",
  roles: [],
  permissions: [],
};

describe("VerifyEmailPage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
    mockQuery = {};
  });

  it("handles ?ok=1 success by bootstrapping session and redirecting to /dashboard", async () => {
    mockQuery = { ok: "1" };
    const session = useSessionStore();
    const bootstrapSpy = vi
      .spyOn(session, "bootstrap")
      .mockResolvedValue(mockVerifiedProfile);

    mount(VerifyEmailPage);
    await flushPromises();

    expect(bootstrapSpy).toHaveBeenCalledWith(true);
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "dashboard" });
  });

  it("renders failure message when bootstrap returns null", async () => {
    mockQuery = { ok: "1" };
    const session = useSessionStore();
    vi.spyOn(session, "bootstrap").mockResolvedValue(null);

    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível verificar o e-mail");
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("renders failure message when ?ok is missing or not 1", async () => {
    mockQuery = { ok: "0" };
    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível verificar o e-mail");
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("shows login link on failure when user is not authenticated", async () => {
    mockQuery = {};
    const session = useSessionStore();
    session.user = null;
    session.status = "unauthenticated";

    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    expect(wrapper.text()).toContain("Ir para o login");
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("shows resend button on failure when user is authenticated", async () => {
    mockQuery = {};
    const session = useSessionStore();
    session.user = {
      id: 2,
      name: "Carlos",
      email: "carlos@example.com",
      email_verified_at: null,
      roles: [],
      permissions: [],
    };
    session.status = "limited";

    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    const resendBtn = wrapper.find("button");
    expect(resendBtn.exists()).toBe(true);
    expect(resendBtn.text()).toBe("Reenviar e-mail de verificação");
  });

  it("triggers resend verification and shows confirmation when clicking resend button", async () => {
    mockQuery = {};
    const session = useSessionStore();
    session.user = {
      id: 2,
      name: "Carlos",
      email: "carlos@example.com",
      email_verified_at: null,
      roles: [],
      permissions: [],
    };
    session.status = "limited";

    const resendSpy = vi
      .spyOn(session, "resendVerification")
      .mockResolvedValue({ message: "Link reenviado." });

    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(resendSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.find("[role='status']").text()).toBe("Link reenviado.");
  });

  it("handles 429 rate limiting on resend verification with Retry-After", async () => {
    mockQuery = {};
    const session = useSessionStore();
    session.user = {
      id: 2,
      name: "Carlos",
      email: "carlos@example.com",
      email_verified_at: null,
      roles: [],
      permissions: [],
    };
    session.status = "limited";

    vi.spyOn(session, "resendVerification").mockRejectedValue(
      buildHttpError({
        kind: "rate_limited",
        status: 429,
        retryAfterHeader: "45",
      }),
    );

    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(wrapper.find("[role='alert']").text()).toContain(
      "Muitas tentativas",
    );
    expect(wrapper.find("[role='alert']").text()).toContain("45 segundos");
  });

  it("disables resend button and blocks duplicate resends while request is pending", async () => {
    mockQuery = {};
    const session = useSessionStore();
    session.user = {
      id: 2,
      name: "Carlos",
      email: "carlos@example.com",
      email_verified_at: null,
      roles: [],
      permissions: [],
    };
    session.status = "limited";

    let resolveResend!: (
      value: Awaited<ReturnType<typeof session.resendVerification>>,
    ) => void;
    const pendingResend = new Promise<
      Awaited<ReturnType<typeof session.resendVerification>>
    >((resolve) => {
      resolveResend = resolve;
    });
    const resendSpy = vi
      .spyOn(session, "resendVerification")
      .mockReturnValue(pendingResend);

    const wrapper = mount(VerifyEmailPage);
    await flushPromises();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    const resendButton = wrapper.find("button");
    expect(resendButton.attributes("disabled")).toBeDefined();
    expect(resendButton.text()).toBe("Reenviando...");

    await wrapper.find("button").trigger("click");
    await flushPromises();
    expect(resendSpy).toHaveBeenCalledTimes(1);

    resolveResend({ message: "Link reenviado." });
    await flushPromises();
    expect(wrapper.find("[role='status']").text()).toBe("Link reenviado.");
    wrapper.unmount();
  });
});
