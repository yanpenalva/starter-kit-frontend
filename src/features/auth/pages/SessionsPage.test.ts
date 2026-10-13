import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { queryClient } from "@/app/providers/query";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { createSessionMocks } from "@/test/session-handlers";
import type { ActiveSession } from "@/features/auth/api/sessions.api";
import SessionsPage from "./SessionsPage.vue";

const SESSIONS_URL = `${TEST_API_BASE}/api/v1/auth/sessions`;
const currentSession: ActiveSession = {
  id: "current-session",
  ip_address: "192.0.2.1",
  user_agent: "Navegador atual",
  last_activity: "2026-10-12T10:00:00Z",
  is_current: true,
};
const otherSession: ActiveSession = {
  id: "other-session",
  ip_address: "192.0.2.2",
  user_agent: "Navegador remoto",
  last_activity: "2026-10-11T10:00:00Z",
  is_current: false,
};

let wrapper: VueWrapper | null = null;

const mountPage = (): VueWrapper =>
  mount(SessionsPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: {
        AdminPageLayout: {
          props: ["title"],
          template:
            "<main><h1>{{ title }}</h1><slot name='subtitle' /><slot /></main>",
        },
      },
    },
  });

const confirmDialogButton = async (
  label: string,
): Promise<HTMLButtonElement> => {
  await vi.waitFor(() =>
    expect(
      document.body.querySelectorAll('[role="dialog"]').length,
    ).toBeGreaterThan(0),
  );
  const dialog = [
    ...document.body.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ].at(-1);
  const button = [
    ...(dialog?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ].find((candidate) => candidate.textContent?.trim() === label);
  if (button === undefined)
    throw new Error(`Botão de confirmação não encontrado: ${label}`);
  return button;
};

describe("SessionsPage", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("destaca a sessão atual e oferece ações apenas para as outras", async () => {
    const mocks = createSessionMocks([currentSession, otherSession]);
    server.use(...mocks.handlers);
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Navegador atual"),
    );

    expect(wrapper?.get('[aria-label="Sessão atual"]').text()).toContain(
      "Este dispositivo",
    );
    expect(
      wrapper
        ?.find('button[aria-label="Encerrar sessão current-session"]')
        .exists(),
    ).toBe(false);
    expect(
      wrapper
        ?.find('button[aria-label="Encerrar sessão other-session"]')
        .exists(),
    ).toBe(true);
    expect(wrapper?.text()).toContain("Encerrar outras sessões");
  });

  it("mostra estado vazio e campos opcionais sem falhar", async () => {
    const mocks = createSessionMocks([]);
    server.use(...mocks.handlers);
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Nenhuma sessão ativa encontrada."),
    );
    expect(
      wrapper?.find('button[aria-label^="Encerrar sessão"]').exists(),
    ).toBe(false);
  });

  it("apresenta erro recuperável e carrega de novo em português", async () => {
    const mocks = createSessionMocks([currentSession]);
    server.use(...mocks.handlers);
    let calls = 0;
    server.use(
      http.get(SESSIONS_URL, ({ request }) => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { message: "Detalhe interno não deve aparecer." },
            { status: 500, headers: makeCorsHeaders(request) },
          );
        }
        return HttpResponse.json(
          { data: [currentSession] },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper?.find('[role="alert"]').exists()).toBe(true),
    );
    expect(wrapper?.get('[role="alert"]').text()).not.toContain(
      "Detalhe interno",
    );
    await wrapper
      ?.get('button[aria-label="Tentar novamente"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Navegador atual"),
    );
    expect(calls).toBe(2);
  });

  it("confirma e revoga uma sessão específica com feedback", async () => {
    const mocks = createSessionMocks([currentSession, otherSession]);
    server.use(...mocks.handlers);
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper
          ?.find('button[aria-label="Encerrar sessão other-session"]')
          .exists(),
      ).toBe(true),
    );
    await wrapper
      ?.get('button[aria-label="Encerrar sessão other-session"]')
      .trigger("click");
    (await confirmDialogButton("Encerrar sessão")).click();

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.method === "DELETE" &&
            call.path === "/api/v1/auth/sessions/other-session",
        ),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Sessão encerrada."),
    );
    expect(wrapper?.text()).toContain("Navegador atual");
    await vi.waitFor(() =>
      expect(wrapper?.text()).not.toContain("Navegador remoto"),
    );
  });

  it("cancela a revogação quando a confirmação é recusada", async () => {
    const mocks = createSessionMocks([currentSession, otherSession]);
    server.use(...mocks.handlers);
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Navegador remoto"),
    );
    await wrapper
      ?.get('button[aria-label="Encerrar sessão other-session"]')
      .trigger("click");

    (await confirmDialogButton("Cancelar")).click();

    expect(mocks.calls.some((call) => call.method === "DELETE")).toBe(false);
    expect(wrapper?.text()).toContain("Navegador remoto");
  });

  it("encerra as outras sessões sem remover a atual", async () => {
    const mocks = createSessionMocks([currentSession, otherSession]);
    server.use(...mocks.handlers);
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Navegador remoto"),
    );
    await wrapper?.get("button").trigger("click");
    (await confirmDialogButton("Encerrar sessões")).click();

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.method === "DELETE" && call.path === "/api/v1/auth/sessions",
        ),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("As outras sessões foram encerradas."),
    );
    expect(wrapper?.text()).toContain("Navegador atual");
    expect(wrapper?.text()).not.toContain("Navegador remoto");
  });

  it("mostra falha de revogação sem expor o corpo cru da API", async () => {
    const mocks = createSessionMocks([currentSession, otherSession]);
    server.use(...mocks.handlers);
    server.use(
      http.delete(`${SESSIONS_URL}/:id`, ({ request }) =>
        HttpResponse.json(
          { message: "Segredo interno da API." },
          { status: 500, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain("Navegador remoto"),
    );
    await wrapper
      ?.get('button[aria-label="Encerrar sessão other-session"]')
      .trigger("click");
    (await confirmDialogButton("Encerrar sessão")).click();

    await vi.waitFor(() =>
      expect(wrapper?.find('[role="alert"]').exists()).toBe(true),
    );
    expect(wrapper?.get('[role="alert"]').text()).not.toContain(
      "Segredo interno",
    );
    expect(wrapper?.text()).toContain("Navegador remoto");
  });
});
