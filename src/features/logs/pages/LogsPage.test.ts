import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import {
  makeAdminActivity,
  makeAuditRouteMocks,
  makePaginated,
} from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { queryClient } from "@/app/providers/query";
import LogsPage from "./LogsPage.vue";

let wrapper: VueWrapper | null = null;

const mountPage = (): VueWrapper => {
  queryClient.clear();
  wrapper = mount(LogsPage, {
    attachTo: document.body,
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  return wrapper;
};

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

const counter = (page: VueWrapper) => page.get(".selection-counter");

const rowCheckbox = (page: VueWrapper, id: number) =>
  page.get<HTMLInputElement>(`[aria-label="Selecionar registro ${id}"]`);

const dialogExpansion = (label: string): HTMLElement => {
  const element = document.body.querySelector<HTMLElement>(
    `[aria-label="${label}"]`,
  );
  if (element === null) {
    throw new Error(`Expansão "${label}" não encontrada.`);
  }
  return element;
};

const activateExpansionByKeyboard = async (
  label: string,
  keyCode: number,
): Promise<void> => {
  dialogExpansion(label).dispatchEvent(
    new KeyboardEvent("keyup", {
      key: keyCode === 13 ? "Enter" : " ",
      keyCode,
      bubbles: true,
    }),
  );
  await vi.waitFor(() =>
    expect(dialogExpansion(label).getAttribute("role")).toBe("button"),
  );
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

  it("envia o termo de busca e o filtro de canal na consulta", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({ id: 1, description: "Perfil atualizado" }),
    ]);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() => expect(page.text()).toContain("Perfil atualizado"));

    const search = page.get('input[type="search"]');
    expect(search.attributes("aria-label")).toBeUndefined();
    expect(page.get("label.ui-search").text()).toContain("Buscar na auditoria");

    await search.setValue("perfil");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("search") === "perfil"),
      ).toBe(true),
    );

    await page.get('select[aria-label="Filtrar por canal"]').setValue("cli");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("log_name") === "cli"),
      ).toBe(true),
    );
  });

  it("keeps audit search editable and the newest term active after a late response", async () => {
    const activities = [
      makeAdminActivity({ id: 1, description: "lento" }),
      makeAdminActivity({ id: 2, description: "rapido" }),
      ...Array.from({ length: 16 }, (_, index) =>
        makeAdminActivity({
          id: index + 3,
          description: `registro ${index + 3}`,
        }),
      ),
    ];
    const requested: Array<{ search: string; page: string | null }> = [];
    const completed: string[] = [];
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/activity-log`, async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const currentPage = Number(url.searchParams.get("page") ?? 1);
        const perPage = Number(url.searchParams.get("per_page") ?? 10);
        requested.push({ search, page: url.searchParams.get("page") });
        await delay(search === "lento" ? 600 : 10);
        completed.push(search);
        const filtered = activities.filter((activity) =>
          activity.description.includes(search),
        );
        const start = (currentPage - 1) * perPage;
        return HttpResponse.json(
          makePaginated(filtered.slice(start, start + perPage), {
            current_page: currentPage,
            last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
            per_page: perPage,
            total: filtered.length,
          }),
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const page = mountPage();
    await vi.waitFor(() => expect(page.text()).toContain("lento"));
    await page.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(page.get(".ui-pagination__status").text()).toContain("Página 2"),
    );

    const search = page.get<HTMLInputElement>('input[type="search"]');
    await search.setValue("lento");
    await vi.waitFor(() =>
      expect(
        requested.some((call) => call.search === "lento" && call.page === "1"),
      ).toBe(true),
    );
    expect(search.element.disabled).toBe(false);

    await search.setValue("rapido");
    await vi.waitFor(() =>
      expect(
        requested.some((call) => call.search === "rapido" && call.page === "1"),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(page.get("tbody").text()).toContain("rapido"),
    );
    await vi.waitFor(() => expect(completed).toContain("lento"));

    expect(page.get("tbody").text()).toContain("rapido");
    expect(page.get("tbody").text()).not.toContain("lento");
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
      expect(page.get(".ui-pagination__range").text()).toBe("1–10 de 16"),
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
      expect(page.get(".ui-pagination__range").text()).toBe("11–16 de 16"),
    );
    expect(page.text()).toContain("Registro número 16");

    await page.get('button[aria-label="Página anterior"]').trigger("click");
    await vi.waitFor(() =>
      expect(page.get(".ui-pagination__range").text()).toBe("1–10 de 16"),
    );
  });

  it("abre o registro em modal teleportado com metadados e payload, e fecha", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({
        id: 7,
        description: "Perfis sincronizados",
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
      expect(page.text()).toContain("Perfis sincronizados"),
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
    expect(dialog.textContent).toContain("Perfis sincronizados");
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

  it("recolhe e reexibe metadados e payload sem perder o JSON original", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({
        id: 11,
        description: "Registro expansível",
        properties: { correlation_id: "corr-11", attributes: { roles: ["a"] } },
      }),
    ]);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() =>
      expect(page.text()).toContain("Registro expansível"),
    );
    await page
      .get('button[aria-label="Ver detalhes do registro 11"]')
      .trigger("click");
    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());

    for (const label of ["Metadados do registro", "Payload da auditoria"]) {
      const header = dialogExpansion(label);
      expect(header.getAttribute("role")).toBe("button");
      expect(header.getAttribute("aria-expanded")).toBe("true");
      expect(header.getAttribute("aria-controls")).not.toBeNull();
    }

    const payload = (): string =>
      document.body.querySelector('[data-testid="activity-payload"]')
        ?.textContent ?? "";

    dialogExpansion("Payload da auditoria").click();
    await vi.waitFor(() =>
      expect(
        dialogExpansion("Payload da auditoria").getAttribute("aria-expanded"),
      ).toBe("false"),
    );
    expect(JSON.parse(payload())).toEqual({
      correlation_id: "corr-11",
      attributes: { roles: ["a"] },
    });

    await activateExpansionByKeyboard("Payload da auditoria", 13);
    expect(
      dialogExpansion("Payload da auditoria").getAttribute("aria-expanded"),
    ).toBe("true");
    expect(JSON.parse(payload())).toEqual({
      correlation_id: "corr-11",
      attributes: { roles: ["a"] },
    });

    await activateExpansionByKeyboard("Metadados do registro", 32);
    expect(
      dialogExpansion("Metadados do registro").getAttribute("aria-expanded"),
    ).toBe("false");
    expect(dialogElement()?.textContent).toContain("Mudança de privilégio");

    dialogExpansion("Metadados do registro").click();
    await vi.waitFor(() =>
      expect(
        dialogExpansion("Metadados do registro").getAttribute("aria-expanded"),
      ).toBe("true"),
    );
  });
});

describe("LogsPage — seleção por página", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("seleciona registros individualmente sem seletor de todos", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({ id: 1, description: "Registro um" }),
      makeAdminActivity({ id: 2, description: "Registro dois" }),
      makeAdminActivity({ id: 3, description: "Registro três" }),
    ]);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 3 selecionados"),
    );
    expect(
      page
        .find('[aria-label="Selecionar todos os registros desta página"]')
        .exists(),
    ).toBe(false);

    await rowCheckbox(page, 1).setValue(true);
    expect(counter(page).text()).toContain("1 de 3 selecionados");

    await rowCheckbox(page, 3).setValue(true);
    expect(counter(page).text()).toContain("2 de 3 selecionados");
    expect(rowCheckbox(page, 3).element.checked).toBe(true);

    await rowCheckbox(page, 1).setValue(false);
    expect(counter(page).text()).toContain("1 de 3 selecionados");

    expect(mocks.calls.filter((call) => call.method !== "GET")).toHaveLength(0);
  });

  it("troca itens por página entre opções permitidas e limpa a seleção", async () => {
    const activities = Array.from({ length: 16 }, (_, index) =>
      makeAdminActivity({ id: index + 1 }),
    );
    const mocks = makeAuditRouteMocks(activities);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 10 selecionados"),
    );
    const perPage = page.get<HTMLSelectElement>(
      'select[aria-label="Itens por página"]',
    );
    expect(perPage.element.value).toBe("10");
    await rowCheckbox(page, 1).setValue(true);
    expect(counter(page).text()).toContain("1 de 10 selecionados");

    await perPage.setValue("5");

    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 5 selecionados"),
    );
    expect(page.get(".ui-pagination__range").text()).toBe("1–5 de 16");
    expect(
      mocks.calls.some(
        (call) =>
          call.query.get("per_page") === "5" && call.query.get("page") === "1",
      ),
    ).toBe(true);
  });

  it("limpa a seleção ao buscar, filtrar e paginar", async () => {
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
      expect(counter(page).text()).toContain("0 de 10 selecionados"),
    );
    await rowCheckbox(page, 1).setValue(true);
    expect(counter(page).text()).toContain("1 de 10 selecionados");

    await page.get('input[type="search"]').setValue("Registro número 2");
    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 1 selecionados"),
    );

    await page.get('input[type="search"]').setValue("");
    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 10 selecionados"),
    );
    await rowCheckbox(page, 3).setValue(true);
    expect(counter(page).text()).toContain("1 de 10 selecionados");

    await page
      .get('select[aria-label="Filtrar por evento"]')
      .setValue("cli.bootstrap");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("event") === "cli.bootstrap"),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 0 selecionados"),
    );

    await page.get('select[aria-label="Filtrar por evento"]').setValue("");
    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 10 selecionados"),
    );
    await rowCheckbox(page, 4).setValue(true);
    expect(counter(page).text()).toContain("1 de 10 selecionados");

    await page.get('button[aria-label="Próxima página"]').trigger("click");

    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 6 selecionados"),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
      true,
    );
    expect(page.text()).toContain("Registro número 16");
  });

  it("mantém após refetch somente os IDs ainda presentes", async () => {
    const activities = Array.from({ length: 4 }, (_, index) =>
      makeAdminActivity({
        id: index + 1,
        description: `Registro número ${index + 1}`,
      }),
    );
    const mocks = makeAuditRouteMocks(activities);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 4 selecionados"),
    );
    await rowCheckbox(page, 1).setValue(true);
    await rowCheckbox(page, 3).setValue(true);
    expect(counter(page).text()).toContain("2 de 4 selecionados");

    activities.splice(
      activities.findIndex((activity) => activity.id === 1),
      1,
    );
    await queryClient.invalidateQueries({ queryKey: ["audit"] });

    await vi.waitFor(() =>
      expect(page.find('[aria-label="Selecionar registro 1"]').exists()).toBe(
        false,
      ),
    );
    expect(counter(page).text()).toContain("1 de 3 selecionados");
    expect(rowCheckbox(page, 3).element.checked).toBe(true);
  });

  it("abre o detalhe sem selecionar o registro", async () => {
    const mocks = makeAuditRouteMocks([
      makeAdminActivity({ id: 5, description: "Registro cinco" }),
      makeAdminActivity({ id: 6, description: "Registro seis" }),
    ]);
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() =>
      expect(counter(page).text()).toContain("0 de 2 selecionados"),
    );
    await page
      .get('button[aria-label="Ver detalhes do registro 5"]')
      .trigger("click");

    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    expect(counter(page).text()).toContain("0 de 2 selecionados");

    dialogButton("Fechar")?.click();
    await vi.waitFor(() => expect(dialogElement()).toBeNull());
    expect(counter(page).text()).toContain("0 de 2 selecionados");
  });
});
