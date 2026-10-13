import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { makeAdminActivity, makeAuditRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { queryClient } from "@/app/providers/query";
import LogsPage from "./LogsPage.vue";

let wrapper: VueWrapper | null = null;

const mountPage = (): VueWrapper => {
  wrapper = mount(LogsPage, {
    attachTo: document.body,
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  return wrapper;
};

// O diálogo é renderizado em Teleport no document.body pelo Quasar, então as
// asserções usam o documento e não o wrapper (sem stub que apague o modal).
const dialogElement = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('[role="dialog"]');

const dialogButton = (text: string): HTMLButtonElement | undefined =>
  [...(dialogElement()?.querySelectorAll("button") ?? [])].find(
    (button) => button.textContent?.trim() === text,
  );

const pressEscape = (): void => {
  for (const type of ["keydown", "keyup"]) {
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", keyCode: 27, bubbles: true }),
    );
  }
};

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = "";
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
    const page = mountPage();

    await vi.waitFor(() => expect(page.text()).toContain("Mudança registrada"));
    expect(page.text()).toContain("Inicialização registrada");
    await page
      .get('select[aria-label="Filtrar por evento"]')
      .setValue("cli.bootstrap");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("event") === "cli.bootstrap"),
      ).toBe(true),
    );
    await page
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
    const page = mountPage();

    await vi.waitFor(() =>
      expect(page.find('[role="alert"]').text()).toContain(
        "Aguarde 30 segundos",
      ),
    );
  });

  it("filtra por busca textual e canal log_name", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({ id: 1, description: "Papel atualizado" }),
    ]);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() => expect(page.text()).toContain("Papel atualizado"));

    const search = page.get('input[type="search"]');
    expect(search.attributes("aria-label")).toBeUndefined();
    expect(page.get("label.ui-search").text()).toContain("Buscar na auditoria");

    await search.setValue("papel");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("search") === "papel"),
      ).toBe(true),
    );

    await page.get('select[aria-label="Filtrar por canal"]').setValue("cli");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("log_name") === "cli"),
      ).toBe(true),
    );
  });

  it("pagina pela meta da API e volta para a primeira página", async () => {
    const activities = Array.from({ length: 16 }, (_, index) =>
      makeAdminActivity({
        id: index + 1,
        description: `Registro número ${index + 1}`,
      }),
    );
    const mocks = makeAuditRouteMocks(activities);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() =>
      expect(page.get(".ui-pagination__range").text()).toBe("1–15 de 16"),
    );
    expect(page.get(".ui-pagination__status").text()).toContain(
      "Página 1 de 2",
    );
    expect(page.text()).toContain("Registro número 1");
    expect(page.text()).not.toContain("Registro número 16");

    await page.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
        true,
      ),
    );
    await vi.waitFor(() =>
      expect(page.get(".ui-pagination__range").text()).toBe("16–16 de 16"),
    );
    expect(page.text()).toContain("Registro número 16");

    await page.get('button[aria-label="Página anterior"]').trigger("click");
    await vi.waitFor(() =>
      expect(page.get(".ui-pagination__range").text()).toBe("1–15 de 16"),
    );
  });

  it("abre o registro em modal teleportado com metadados e payload, e fecha", async () => {
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
    const page = mountPage();

    await vi.waitFor(() =>
      expect(page.text()).toContain("Papéis sincronizados"),
    );
    expect(dialogElement()).toBeNull();

    await page
      .get('button[aria-label="Ver detalhes do registro 7"]')
      .trigger("click");

    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    const dialog = dialogElement() as HTMLElement;
    expect(page.element.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog.getAttribute("aria-labelledby")).not.toBeNull();
    expect(dialog.textContent).toContain("Detalhes do registro #7");
    expect(dialog.textContent).toContain("Evento");
    expect(dialog.textContent).toContain("Mudança de privilégio");
    expect(dialog.textContent).toContain("Papéis sincronizados");
    expect(dialog.textContent).toContain("corr-42");

    dialogButton("Fechar")?.click();
    await vi.waitFor(() => expect(dialogElement()).toBeNull());

    await page
      .get('button[aria-label="Ver detalhes do registro 7"]')
      .trigger("click");
    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    pressEscape();
    await vi.waitFor(() => expect(dialogElement()).toBeNull());
  });

  it("formata o payload do modal como JSON legível", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({
        id: 9,
        description: "Registro simples",
        properties: { correlation_id: "corr-9", actor_type: "cli" },
      }),
    ]);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() => expect(page.text()).toContain("Registro simples"));
    await page
      .get('button[aria-label="Ver detalhes do registro 9"]')
      .trigger("click");
    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());

    const pre = document.body.querySelector('[data-testid="activity-payload"]');
    expect(pre).not.toBeNull();
    expect(JSON.parse(pre?.textContent ?? "")).toEqual({
      correlation_id: "corr-9",
      actor_type: "cli",
    });
  });
});
