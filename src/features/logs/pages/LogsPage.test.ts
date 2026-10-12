import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { makeAdminActivity, makeAuditRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { queryClient } from "@/app/providers/query";
import LogsPage from "./LogsPage.vue";

const mountPage = () =>
  mount(LogsPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
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

  it("mostra contagem regressiva quando a listagem recebe 429", async () => {
    const mocks = makeAuditRouteMocks([]);
    server.use(...mocks.handlers);
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/activity-log`, async ({ request }) =>
        HttpResponse.json(
          { message: "Muitas tentativas." },
          {
            status: 429,
            headers: { ...makeCorsHeaders(request), "Retry-After": "30" },
          },
        ),
      ),
    );
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "Aguarde 30 segundos",
      ),
    );
  });

  it("filtra por busca textual e canal log_name", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({ id: 1, description: "Papel atualizado" }),
    ]);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Papel atualizado"),
    );

    const search = wrapper.get('input[aria-label="Buscar na auditoria"]');
    await search.setValue("papel");
    await search.trigger("input");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("search") === "papel"),
      ).toBe(true),
    );

    await wrapper.get('select[aria-label="Filtrar por canal"]').setValue("cli");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("log_name") === "cli"),
      ).toBe(true),
    );
  });

  it("abre drawer com os detalhes do registro e fecha", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({
        id: 7,
        description: "Papéis sincronizados",
        properties: {
          correlation_id: "corr-42",
          actor_type: "user",
          actor_id: 3,
          attributes: { roles: ["admin", "user"] },
        },
      }),
    ]);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Papéis sincronizados"),
    );
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper
      .get('button[aria-label="Ver detalhes do registro 7"]')
      .trigger("click");

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.text()).toContain("Papéis sincronizados");
    expect(dialog.text()).toContain("corr-42");
    expect(dialog.text()).toContain("attributes");

    await wrapper
      .get('button[aria-label="Fechar detalhes do registro 7"]')
      .trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("formata o payload do drawer como JSON legível", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({
        id: 9,
        description: "Registro simples",
        properties: { correlation_id: "corr-9", actor_type: "cli" },
      }),
    ]);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Registro simples"),
    );
    await wrapper
      .get('button[aria-label="Ver detalhes do registro 9"]')
      .trigger("click");

    const pre = wrapper.get('[role="dialog"] pre');
    const formatted = JSON.parse(pre.text());
    expect(formatted).toEqual({
      correlation_id: "corr-9",
      actor_type: "cli",
    });
  });
});
