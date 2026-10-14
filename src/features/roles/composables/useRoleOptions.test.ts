import { describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import type { RoleOption } from "./useRoleOptions";
import { useRoleOptions } from "./useRoleOptions";

const makeRole = (id: number, name: string) => ({
  id,
  name,
  guard_name: "web",
  permissions: [],
});

const setupListRoles = (
  pages: {
    data: RoleOption[];
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
  it("loads the first page and exposes the options", async () => {
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

  it("searches by term and resets pagination", async () => {
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

  it("loads the next page accumulating options", async () => {
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

  it("stops loadAll when authorization cancels a pending page", async () => {
    const enabled = ref(true);
    let releasePage: (() => void) | undefined;
    const pagePending = new Promise<void>((resolve) => {
      releasePage = resolve;
    });
    const calls: number[] = [];
    const listRoles = vi.fn(async (filters: { page?: number }) => {
      const page = filters.page ?? 1;
      calls.push(page);
      if (calls.length === 3) await pagePending;
      return {
        data: [makeRole(page, `role-${page}`)],
        meta: { current_page: page, last_page: 2, total: 2 },
      };
    });
    const { loadAll } = useRoleOptions(listRoles, () => enabled.value);

    await vi.waitFor(() => expect(calls).toEqual([1]));
    const loadingAll = loadAll();
    await vi.waitFor(() => expect(calls).toEqual([1, 1, 2]));
    enabled.value = false;
    await nextTick();
    releasePage?.();

    await loadingAll;
    expect(calls).toEqual([1, 1, 2]);
  });

  it("ignores loadMore without a next page", async () => {
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

  it("deduplicates repeated roles across pages", async () => {
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

  it("does not query the catalog while roles.view is missing", async () => {
    const enabled = ref(false);
    const listRoles = setupListRoles([
      {
        data: [makeRole(1, "user")],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    ]);
    const { options } = useRoleOptions(listRoles, () => enabled.value);

    await Promise.resolve();
    expect(listRoles).not.toHaveBeenCalled();
    expect(options.value).toEqual([]);

    enabled.value = true;
    await vi.waitFor(() =>
      expect(options.value).toEqual([{ id: 1, name: "user", permissions: [] }]),
    );
    expect(listRoles).toHaveBeenCalledTimes(1);
  });

  it("keeps options after an error and allows retrying", async () => {
    let shouldFail = false;
    const listRoles = vi.fn(async (filters: { search?: string }) => {
      if (shouldFail) throw new Error("catalog unavailable");
      return {
        data: [makeRole(1, filters.search ? "editor" : "user")],
        meta: { current_page: 1, last_page: 1, total: 1 },
      };
    });
    const { options, hasError, retry, search } = useRoleOptions(listRoles);

    await vi.waitFor(() => expect(options.value[0]?.name).toBe("user"));
    shouldFail = true;
    search("edi");
    await vi.waitFor(() => expect(hasError.value).toBe(true));
    expect(options.value.map((option) => option.name)).toEqual(["user"]);

    shouldFail = false;
    await retry();
    expect(hasError.value).toBe(false);
    expect(options.value.map((option) => option.name)).toEqual(["editor"]);
  });
});
