import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { server } from "@/test/server";
import { makeAdminUser, makeUsersRouteMocks } from "@/test/admin-handlers";
import {
  useUsersList,
  usersSearchDebounce,
  useUserDetail,
} from "./useUsersList";

const users = [
  makeAdminUser({ id: 1, name: "Alice Souza", email: "alice@example.test" }),
  makeAdminUser({
    id: 2,
    name: "Bob Lima",
    email: "bob@example.test",
    deactivated_at: "2026-10-05T08:00:00Z",
    roles: ["admin"],
  }),
];

import { defineComponent, effectScope, h, reactive } from "vue";

function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T;
  const host = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    },
  });
  const wrapper = mount(host, {
    global: { plugins: [VueQueryPlugin] },
  });
  return { result, unmount: () => wrapper.unmount() };
}

describe("useUsersList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the first page through TanStack Query", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const { result, unmount } = withSetup(() => useUsersList());

    await vi.waitFor(() => {
      expect(result.query.data.value?.data).toHaveLength(2);
    });
    expect(result.query.data.value?.meta.total).toBe(2);

    unmount();
  });

  it("sends debounced search, status and role filters", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const { result, unmount } = withSetup(() => useUsersList());
    result.filters.search = "ali";

    const debounced = vi.waitFor(() => {
      expect(
        mocks.calls.some((call) => call.query.get("search") === "ali"),
      ).toBe(true);
    });
    result.filters.status = "active";
    result.filters.role = "user";
    await debounced;

    await vi.waitFor(() => {
      expect(
        mocks.calls.some(
          (call) =>
            call.query.get("search") === "ali" &&
            call.query.get("status") === "active" &&
            call.query.get("role") === "user",
        ),
      ).toBe(true);
    });

    unmount();
  });

  it("resets to the first page when filters change", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const { result, unmount } = withSetup(() => useUsersList());
    result.filters.page = 2;
    await nextTick();
    result.resetAndGoToFirstPage();

    expect(result.filters.page).toBe(1);
    unmount();
  });

  it("setUserStatus mutation posts the transition and invalidates", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const { result, unmount } = withSetup(() => useUsersList());
    await vi.waitFor(() => {
      expect(result.query.isSuccess.value).toBe(true);
    });

    await result.statusMutation.mutateAsync({
      userId: 2,
      payload: { status: "active" },
    });

    const statusCalls = mocks.calls.filter(
      (call) => call.path === "/api/v1/users/2/status",
    );
    expect(statusCalls).toHaveLength(1);
    expect(statusCalls[0]?.body).toEqual({ status: "active" });

    unmount();
  });

  it("assignRoles mutation replaces roles via PUT", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const { result, unmount } = withSetup(() => useUsersList());
    await vi.waitFor(() => {
      expect(result.query.isSuccess.value).toBe(true);
    });

    await result.rolesMutation.mutateAsync({
      userId: 1,
      payload: { roles: ["admin"] },
    });

    const rolesCalls = mocks.calls.filter(
      (call) => call.path === "/api/v1/users/1/roles",
    );
    expect(rolesCalls).toHaveLength(1);
    expect(rolesCalls[0]?.body).toEqual({ roles: ["admin"] });

    unmount();
  });

  it("updateMutation patches user attributes", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const { result, unmount } = withSetup(() => useUsersList());
    await vi.waitFor(() => {
      expect(result.query.isSuccess.value).toBe(true);
    });

    await result.updateMutation.mutateAsync({
      userId: 1,
      payload: { name: "Alice Editada" },
    });

    const patchCalls = mocks.calls.filter((call) => call.method === "PATCH");
    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0]?.body).toEqual({ name: "Alice Editada" });

    unmount();
  });

  it("useUserDetail fetches a single user when enabled", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);

    const selectedId = vi.fn<() => number | null>(() => 2);
    const { result, unmount } = withSetup(() => useUserDetail(selectedId));

    await vi.waitFor(() => {
      expect(result.data.value?.data.email).toBe("bob@example.test");
    });

    unmount();
  });

  it("debounces rapid search typing into one delayed apply", async () => {
    vi.useFakeTimers();
    try {
      const filters = reactive({ search: "" }) as unknown as Parameters<
        typeof usersSearchDebounce
      >[0];
      const apply = vi.fn();
      let stop: (() => void) | undefined;
      const scope = effectScope();
      scope.run(() => {
        stop = usersSearchDebounce(filters, apply, 350);
      });

      filters.search = "a";
      await vi.advanceTimersByTimeAsync(100);
      filters.search = "al";
      await vi.advanceTimersByTimeAsync(100);
      filters.search = "ali";
      expect(apply).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(400);
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith("ali");
      stop?.();
      scope.stop();
    } finally {
      vi.useRealTimers();
    }
  });
});
