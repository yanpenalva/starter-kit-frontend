import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
} from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import AppHeader from "./AppHeader.vue";

const { mockRouterPush } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

const QMenuStub = defineComponent({
  name: "QMenu",
  props: {
    modelValue: { type: Boolean, default: false },
    target: { type: Object as PropType<HTMLElement | null>, default: null },
    anchor: { type: String, default: undefined },
    self: { type: String, default: undefined },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, slots }) {
    const toggle = (): void => emit("update:modelValue", !props.modelValue);
    onMounted(() => props.target?.addEventListener("click", toggle));
    onBeforeUnmount(() => props.target?.removeEventListener("click", toggle));
    return () => h("div", { class: "account-menu" }, slots.default?.());
  },
});

const mountHeader = () =>
  mount(AppHeader, {
    props: { isDesktop: true, mini: false, drawerOpen: false },
    global: {
      stubs: {
        "q-header": { template: "<header><slot /></header>" },
        "q-menu": QMenuStub,
      },
    },
  });

describe("AppHeader.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
  });

  it("anchors the account menu to its button and keeps the navigation toggle separate", async () => {
    const wrapper = mountHeader();
    await wrapper.vm.$nextTick();
    const menu = wrapper.getComponent({ name: "QMenu" });

    expect(menu.props("target")).toBe(
      wrapper.get(".app-header__account").element,
    );
    await wrapper.get(".app-header__toggle").trigger("click");
    expect(
      wrapper.get(".app-header__account").attributes("aria-expanded"),
    ).toBe("false");
    expect(wrapper.emitted("toggle")).toHaveLength(1);

    await wrapper.get(".app-header__account").trigger("click");
    expect(
      wrapper.get(".app-header__account").attributes("aria-expanded"),
    ).toBe("true");
  });

  it("completes logout and navigates to login on success", async () => {
    const session = useSessionStore();
    const logout = vi.spyOn(session, "logout").mockResolvedValue(undefined);
    const wrapper = mountHeader();

    await wrapper.get(".app-header__account").trigger("click");
    await wrapper.vm.$nextTick();
    await wrapper.get(".account-menu button").trigger("click");

    expect(logout).toHaveBeenCalledOnce();
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "login" });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("reports logout failure and still navigates to login", async () => {
    const session = useSessionStore();
    const logout = vi
      .spyOn(session, "logout")
      .mockRejectedValue(new Error("logout failed"));
    const wrapper = mountHeader();

    await wrapper.get(".app-header__account").trigger("click");
    await wrapper.vm.$nextTick();
    await wrapper.get(".account-menu button").trigger("click");

    expect(logout).toHaveBeenCalledOnce();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      "Não foi possível concluir a solicitação de saída.",
    );
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "login" });
  });
});
