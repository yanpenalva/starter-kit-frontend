import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { makeAdminRole } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import RoleMultiSelect from "./RoleMultiSelect.vue";

type RoleRecord = ReturnType<typeof makeAdminRole>;

const mountSelect = (
  modelValue: string[] = [],
  disabled = false,
  canViewCatalog = true,
) =>
  mount(RoleMultiSelect, {
    props: {
      modelValue,
      disabled,
      canViewCatalog,
      ariaLabel: "Perfis do usuário",
    },
  });

const makeRolesHandler = (roles: RoleRecord[]) =>
  http.get(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("per_page") ?? "50");
    const filtered = roles.filter(
      (role) => search === "" || role.name.toLowerCase().includes(search),
    );
    const start = (page - 1) * perPage;
    const data = filtered.slice(start, start + perPage);
    return HttpResponse.json(
      {
        data,
        links: { first: null, last: null, prev: null, next: null },
        meta: {
          current_page: page,
          from: null,
          last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
          path: "",
          per_page: perPage,
          to: null,
          total: filtered.length,
        },
      },
      { headers: makeCorsHeaders(request) },
    );
  });

describe("RoleMultiSelect", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("carrega as opções paginadas da API", async () => {
    const calls: string[] = [];
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) => {
        const url = new URL(request.url);
        calls.push(url.searchParams.get("page") ?? "1");
        return HttpResponse.json(
          {
            data: [
              makeAdminRole({ id: 1, name: "admin" }),
              makeAdminRole({ id: 2, name: "user" }),
            ],
            links: { first: null, last: null, prev: null, next: null },
            meta: {
              current_page: 1,
              from: null,
              last_page: 1,
              path: "",
              per_page: 50,
              to: null,
              total: 2,
            },
          },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const wrapper = mountSelect();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Perfil admin"]').exists()).toBe(true),
    );
    expect(wrapper.find('[aria-label="Perfil user"]').exists()).toBe(true);
    expect(calls).toContain("1");
  });

  it("filtra opções pelo termo pesquisado", async () => {
    server.use(
      makeRolesHandler([
        makeAdminRole({ id: 1, name: "admin" }),
        makeAdminRole({ id: 2, name: "editor" }),
        makeAdminRole({ id: 3, name: "user" }),
      ]),
    );
    const wrapper = mountSelect();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Perfil editor"]').exists()).toBe(true),
    );
    await wrapper
      .get('input[aria-label="Buscar perfis para Perfis do usuário"]')
      .setValue("edi");

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Perfil admin"]').exists()).toBe(false),
    );
    expect(wrapper.find('[aria-label="Perfil editor"]').exists()).toBe(true);
  });

  it("emite seleção e remoção de perfis", async () => {
    server.use(
      makeRolesHandler([
        makeAdminRole({ id: 1, name: "admin" }),
        makeAdminRole({ id: 2, name: "editor" }),
      ]),
    );
    const wrapper = mountSelect(["editor"]);

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Perfil admin"]').exists()).toBe(true),
    );
    await wrapper.get('[aria-label="Perfil admin"]').setValue(true);

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted?.at(-1)).toEqual([["editor", "admin"]]);

    await wrapper.setProps({ modelValue: ["editor", "admin"] });
    await wrapper.get('[aria-label="Remover perfil editor"]').trigger("click");
    const emittedAgain = wrapper.emitted("update:modelValue");
    expect(emittedAgain?.at(-1)).toEqual([["admin"]]);
  });

  it("desabilita os controles quando disabled", async () => {
    server.use(makeRolesHandler([makeAdminRole({ id: 1, name: "admin" })]));
    const wrapper = mountSelect(["admin"], true);

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Perfil admin"]').exists()).toBe(true),
    );
    expect(
      wrapper.get('[aria-label="Perfil admin"]').attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper.get('[aria-label="Remover perfil admin"]').attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper
        .get('input[aria-label="Buscar perfis para Perfis do usuário"]')
        .attributes("disabled"),
    ).toBeDefined();
  });

  it("preserva os perfis selecionados e não consulta sem roles.view", async () => {
    let calls = 0;
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/roles`, ({ request }) => {
        calls += 1;
        return HttpResponse.json(
          { data: [], links: {}, meta: {} },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const wrapper = mountSelect(["user"], false, false);

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain(
        "A permissão roles.view é necessária para consultar o catálogo.",
      ),
    );
    expect(wrapper.find('[aria-label="Perfis selecionados"]').text()).toContain(
      "Usuário",
    );
    expect(wrapper.find('input[type="search"]').exists()).toBe(false);
    expect(calls).toBe(0);
  });

  it("permite retry após erro de catálogo sem apagar os chips", async () => {
    let calls = 0;
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/roles`, ({ request }) => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { message: "Sem permissão." },
            { status: 403, headers: makeCorsHeaders(request) },
          );
        }
        return HttpResponse.json(
          {
            data: [makeAdminRole({ id: 2, name: "editor" })],
            links: { first: null, last: null, prev: null, next: null },
            meta: {
              current_page: 1,
              from: 1,
              last_page: 1,
              path: "",
              per_page: 50,
              to: 1,
              total: 1,
            },
          },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const wrapper = mountSelect(["user"]);

    await vi.waitFor(() =>
      expect(wrapper.get('[role="alert"]').text()).toContain(
        "Não foi possível carregar o catálogo",
      ),
    );
    expect(wrapper.get('[aria-label="Perfis selecionados"]').text()).toContain(
      "Usuário",
    );
    const retryButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Tentar novamente"));
    expect(retryButton).toBeDefined();
    await retryButton?.trigger("click");

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Perfil editor"]').exists()).toBe(true),
    );
    expect(wrapper.get('[aria-label="Perfis selecionados"]').text()).toContain(
      "Usuário",
    );
    expect(calls).toBe(2);
  });
});
