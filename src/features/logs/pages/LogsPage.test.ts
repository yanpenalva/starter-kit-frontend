import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAdminActivity, makeAuditRouteMocks } from "@/test/admin-handlers";
import { server } from "@/test/server";
import LogsPage from "./LogsPage.vue";

const mountPage = () =>
  mount(LogsPage, {
    global: {
      plugins: [VueQueryPlugin],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });

describe("LogsPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("loads audit events and filters by event and subject", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({ id: 1, description: "Mudança registrada" }),
      makeAdminActivity({
        id: 2,
        event: "cli.bootstrap",
        subject_type: "role",
        description: "Inicialização registrada",
      }),
    ]);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Mudança registrada"),
    );
    expect(wrapper.text()).toContain("Inicialização registrada");
    await wrapper
      .get('select[aria-label="Filtrar por evento"]')
      .setValue("cli.bootstrap");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("event") === "cli.bootstrap"),
      ).toBe(true),
    );
    await wrapper
      .get('select[aria-label="Filtrar por tipo de entidade"]')
      .setValue("role");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("subject_type") === "role"),
      ).toBe(true),
    );
  });
});
