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
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { matchesAuditSearch } from "@/features/logs/api/audit-search";
import { queryClient } from "@/app/providers/query";
import LogsPage from "./LogsPage.vue";

let wrapper: VueWrapper | null = null;

const mountPage = (
  permissions: readonly string[] = [...CATALOGUE_PERMISSIONS],
): VueWrapper => {
  queryClient.clear();
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...permissions],
  };
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

  it("não consulta a auditoria sem logs.view", async () => {
    const mocks = makeAuditRouteMocks([makeAdminActivity()]);
    server.use(...mocks.handlers);
    const page = mountPage(
      CATALOGUE_PERMISSIONS.filter((p) => p !== "logs.view"),
    );

    await vi.waitFor(() =>
      expect(page.get('[data-testid="logs-restricted"]').text()).toContain(
        "logs.view",
      ),
    );
    expect(mocks.calls).toHaveLength(0);
  });

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

  it("busca por nome do ator a cada letra e combina com os filtros", async () => {
    const mocks = makeAuditRouteMocks(
      [
        makeAdminActivity({
          id: 7,
          event: "user.updated",
          description: "Perfil atualizado",
          properties: {
            correlation_id: "corr-7",
            actor_type: "user",
            actor_id: "7",
            action: "user.assign_roles",
          },
        }),
      ],
      { actorNames: { 7: "Maria Silva" } },
    );
    server.use(...mocks.handlers);
    const page = mountPage();

    await vi.waitFor(() => expect(page.text()).toContain("Perfil atualizado"));

    const search = page.get('input[type="search"]');
    expect(search.attributes("aria-label")).toBeUndefined();
    expect(page.get("label.ui-search").text()).toContain(
      "Buscar por ator, evento ou ação",
    );

    await page
      .get('select[aria-label="Filtrar por ação"]')
      .setValue("user.assign_roles");
    for (const term of ["M", "Ma", "Mar"]) {
      await search.setValue(term);
      await vi.waitFor(
        () =>
          expect(
            mocks.calls.some(
              (call) =>
                call.query.get("search") === term &&
                call.query.get("action") === "user.assign_roles",
            ),
          ).toBe(true),
        { timeout: 2000 },
      );
    }

    expect(mocks.calls.some((call) => call.query.has("log_name"))).toBe(false);
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
          matchesAuditSearch(activity, search),
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
          actor_id: "3",
          action: "user.assign_roles",
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
        properties: {
          correlation_id: "corr-11",
          actor_type: "user",
          actor_id: "11",
          action: "user.assign_roles",
        },
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
      expect(header.getAttribute("aria-expanded")).toBe(
        label === "Metadados do registro" ? "true" : "false",
      );
      expect(header.getAttribute("aria-controls")).not.toBeNull();
    }

    const payload = (): string =>
      document.body.querySelector('[data-testid="activity-payload"]')
        ?.textContent ?? "";

    dialogExpansion("Payload da auditoria").click();
    await vi.waitFor(() =>
      expect(
        dialogExpansion("Payload da auditoria").getAttribute("aria-expanded"),
      ).toBe("true"),
    );
    expect(
      dialogExpansion("Metadados do registro").getAttribute("aria-expanded"),
    ).toBe("false");
    expect(JSON.parse(payload())).toEqual({
      correlation_id: "corr-11",
      actor_type: "user",
      actor_id: "11",
      action: "user.assign_roles",
    });

    await activateExpansionByKeyboard("Payload da auditoria", 13);
    expect(
      dialogExpansion("Payload da auditoria").getAttribute("aria-expanded"),
    ).toBe("false");
    expect(JSON.parse(payload())).toEqual({
      correlation_id: "corr-11",
      actor_type: "user",
      actor_id: "11",
      action: "user.assign_roles",
    });

    await activateExpansionByKeyboard("Metadados do registro", 32);
    expect(
      dialogExpansion("Metadados do registro").getAttribute("aria-expanded"),
    ).toBe("true");
    expect(dialogElement()?.textContent).toContain("Mudança de privilégio");

    dialogExpansion("Metadados do registro").click();
    await vi.waitFor(() =>
      expect(
        dialogExpansion("Metadados do registro").getAttribute("aria-expanded"),
      ).toBe("false"),
    );
  });
});

describe("LogsPage — seleção", () => {
  it("renders audit rows without unused selection checkboxes", async () => {
    server.use(...makeAuditRouteMocks([makeAdminActivity()]).handlers);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    expect(wrapper.find("input[type=checkbox]").exists()).toBe(false);
  });
});
