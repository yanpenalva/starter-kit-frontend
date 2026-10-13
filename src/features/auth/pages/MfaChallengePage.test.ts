import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { buildHttpError } from "@/lib/http";
import { useSessionStore } from "@/features/auth/stores/session";
import MfaChallengePage from "./MfaChallengePage.vue";

const mockRouterPush = vi.fn();
const mockQuery: Record<string, string> = {};

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template: "<a><slot /></a>",
  },
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ query: mockQuery }),
}));

describe("MfaChallengePage.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
  });

  it("submits a six-digit code and continues after challenge completion", async () => {
    const session = useSessionStore();
    session.status = "mfa_required";
    const completeChallenge = vi
      .spyOn(session, "completeChallenge")
      .mockResolvedValue({
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        email_verified_at: "2026-10-01T00:00:00Z",
        roles: ["admin"],
        permissions: [],
      });
    const wrapper = mount(MfaChallengePage);

    const input = wrapper.get("#mfa-code");
    expect(input.attributes("maxlength")).toBe("6");
    await input.setValue("123456");
    await wrapper.get("form").trigger("submit.prevent");
    await flushPromises();

    expect(completeChallenge).toHaveBeenCalledWith({ code: "123456" });
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "dashboard" });
  });

  it("shows the API field error for an invalid code", async () => {
    const session = useSessionStore();
    session.status = "mfa_required";
    vi.spyOn(session, "completeChallenge").mockRejectedValue(
      buildHttpError({
        kind: "validation",
        status: 422,
        body: {
          message: "O código informado é inválido.",
          errors: { code: ["Confira o código e tente novamente."] },
        },
      }),
    );
    const wrapper = mount(MfaChallengePage);

    await wrapper.get("#mfa-code").setValue("000000");
    await wrapper.get("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("Confira o código e tente novamente.");
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("switches to recovery-code entry and submits recovery_code", async () => {
    const session = useSessionStore();
    session.status = "mfa_required";
    const completeChallenge = vi
      .spyOn(session, "completeChallenge")
      .mockResolvedValue({
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        email_verified_at: "2026-10-01T00:00:00Z",
        roles: ["admin"],
        permissions: [],
      });
    const wrapper = mount(MfaChallengePage);

    await wrapper.get(".mfa-form__toggle").trigger("click");
    expect(wrapper.text()).toContain("usar código de autenticação");
    await wrapper.get("#mfa-recovery-code").setValue("ABCD-EFGH");
    await wrapper.get("form").trigger("submit.prevent");
    await flushPromises();

    expect(completeChallenge).toHaveBeenCalledWith({
      recovery_code: "ABCD-EFGH",
    });
  });
});
