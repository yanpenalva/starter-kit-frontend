import { describe, expect, it, vi } from "vitest";
import { useRoleOptions } from "./useRoleOptions";

const makeRole = (id: number, name: string) => ({
  id,
  name,
  guard_name: "web",
  permissions: [],
});

const setupListRoles = (
  pages: {
    data: { id: number; name: string }[];
    meta: { current_page: number; last_page: number; total: number };
  }[],
) => {
  let call = 0;
  return vi.fn(async (filters: { page?: number; search?: string }) => {
    const page = pages[Math.min(call, pages.length - 1)]!;
    call += 1;
    return {
      data: page.data,
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: filters.page ?? 1,
        from: null,
        last_page: page.meta.last_page,
        path: "",
        per_page: 15,
        to: null,
        total: page.meta.total,
      },
    };
  });
};

describe("useRoleOptions", () => {
  it("carrega a primeira página e expõe as opções", async () => {
    const listRoles = setupListRoles([
      {
        data: [makeRole(1, "admin"), makeRole(2, "user")],
        meta: { current_page: 1, last_page: 1, total: 2 },
      },
    ]);
    const { options, isLoading, hasMore } = useRoleOptions(listRoles);

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(options.value.map((option) => option.name)).toEqual([
      "admin",
      "user",
    ]);
    expect(hasMore.value).toBe(false);
  });

  it("busca pelo termo e reinicia a paginação", async () => {
    let receivedSearch = "";
    const listRoles = vi.fn(
      async (filters: { page?: number; search?: string }) => {
        receivedSearch = filters.search ?? "";
        return {
          data: receivedSearch === "edi" ? [makeRole(3, "editor")] : [],
          links: { first: null, last: null, prev: null, next: null },
          meta: {
            current_page: 1,
            from: null,
            last_page: 1,
            path: "",
            per_page: 15,
            to: null,
            total: 1,
          },
        };
      },
    );
    const { options, search } = useRoleOptions(listRoles);

    await vi.waitFor(() => expect(options.value).toHaveLength(0));
    search("edi");

    await vi.waitFor(() =>
      expect(options.value.map((option) => option.name)).toEqual(["editor"]),
    );
    expect(receivedSearch).toBe("edi");
  });

  it("carrega a página seguinte acumulando opções", async () => {
    const listRoles = vi.fn(async (filters: { page?: number }) => {
      const page = filters.page ?? 1;
      return {
        data: page === 1 ? [makeRole(1, "admin")] : [makeRole(2, "editor")],
        links: { first: null, last: null, prev: null, next: null },
        meta: {
          current_page: page,
          from: null,
          last_page: 2,
          path: "",
          per_page: 1,
          to: null,
          total: 2,
        },
      };
    });
    const { options, loadMore, hasMore } = useRoleOptions(listRoles);

    await vi.waitFor(() => expect(options.value).toHaveLength(1));
    expect(hasMore.value).toBe(true);

    await loadMore();

    expect(options.value.map((option) => option.name)).toEqual([
      "admin",
      "editor",
    ]);
  });

  it("ignora loadMore sem página seguinte", async () => {
    const listRoles = setupListRoles([
      {
        data: [makeRole(1, "admin")],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    ]);
    const { options, loadMore } = useRoleOptions(listRoles);

    await vi.waitFor(() => expect(options.value).toHaveLength(1));
    await loadMore();

    expect(options.value).toHaveLength(1);
  });

  it("deduplica papéis repetidos entre páginas", async () => {
    const listRoles = vi.fn(async (filters: { page?: number }) => {
      const page = filters.page ?? 1;
      return {
        data: [makeRole(1, "admin")],
        links: { first: null, last: null, prev: null, next: null },
        meta: {
          current_page: page,
          from: null,
          last_page: 2,
          path: "",
          per_page: 1,
          to: null,
          total: 2,
        },
      };
    });
    const { options, loadMore } = useRoleOptions(listRoles);

    await vi.waitFor(() => expect(options.value).toHaveLength(1));
    await loadMore();

    expect(options.value).toHaveLength(1);
  });
});
