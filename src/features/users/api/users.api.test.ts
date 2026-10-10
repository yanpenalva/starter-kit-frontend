import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@/test/server";
import {
  assignUserRoles,
  listUsers,
  setUserStatus,
  showUser,
  updateUser,
} from "./users.api";
import { makeAdminUser, makeUsersRouteMocks } from "@/test/admin-handlers";

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

describe("users.api", () => {
  let calls: ReturnType<typeof makeUsersRouteMocks>["calls"];

  beforeEach(() => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);
    calls = mocks.calls;
  });

  it("lists users with allowlisted filters and pagination", async () => {
    const page = await listUsers({
      page: 1,
      per_page: 25,
      search: "ali",
      status: "active",
      role: "user",
    });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.name).toBe("Alice Souza");
    expect(page.meta).toMatchObject({
      current_page: 1,
      per_page: 25,
      total: 1,
      last_page: 1,
    });

    const call = calls[0];
    expect(call?.method).toBe("GET");
    expect(call?.path).toBe("/api/v1/users");
    expect(call?.query.get("page")).toBe("1");
    expect(call?.query.get("per_page")).toBe("25");
    expect(call?.query.get("search")).toBe("ali");
    expect(call?.query.get("status")).toBe("active");
    expect(call?.query.get("role")).toBe("user");
  });

  it("paginates beyond the first page", async () => {
    const manyUsers = Array.from({ length: 25 }, (_, index) =>
      makeAdminUser({
        id: index + 10,
        name: `User ${index + 10}`,
        email: `user${index + 10}@example.test`,
      }),
    );
    const mocks = makeUsersRouteMocks(manyUsers);
    server.use(...mocks.handlers);

    const firstPage = await listUsers({ page: 1, per_page: 10 });
    expect(firstPage.data).toHaveLength(10);
    expect(firstPage.meta.last_page).toBe(3);

    const secondPage = await listUsers({ page: 2, per_page: 10 });
    expect(secondPage.data).toHaveLength(10);
    expect(secondPage.data[0]?.id).toBe(20);
    expect(secondPage.meta.current_page).toBe(2);
  });

  it("shows a user by id", async () => {
    const response = await showUser(2);

    expect(response.data.email).toBe("bob@example.test");
    expect(calls[0]?.path).toBe("/api/v1/users/2");
  });

  it("updates basic attributes via PATCH", async () => {
    const response = await updateUser(1, {
      name: "Alice Novo",
      cpf: null,
    });

    expect(response.data.name).toBe("Alice Novo");
    expect(calls[0]?.method).toBe("PATCH");
    expect(calls[0]?.body).toEqual({ name: "Alice Novo", cpf: null });
  });

  it("posts status transitions", async () => {
    const response = await setUserStatus(2, { status: "active" });

    expect(response.data.deactivated_at).toBeNull();
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.path).toBe("/api/v1/users/2/status");
    expect(calls[0]?.body).toEqual({ status: "active" });
  });

  it("replaces roles via PUT", async () => {
    const response = await assignUserRoles(1, { roles: ["admin", "user"] });

    expect(response.data.roles).toEqual(["admin", "user"]);
    expect(calls[0]?.method).toBe("PUT");
    expect(calls[0]?.path).toBe("/api/v1/users/1/roles");
    expect(calls[0]?.body).toEqual({ roles: ["admin", "user"] });
  });

  it("propagates 404 as HttpError", async () => {
    await expect(showUser(999)).rejects.toMatchObject({
      kind: "not_found",
      status: 404,
    });
  });
  it("omits empty filters from the request", async () => {
    await listUsers({ page: 1, per_page: 15, search: "", status: undefined });

    const call = calls[0];
    expect(call?.query.has("search")).toBe(false);
    expect(call?.query.has("status")).toBe(false);
    expect(call?.query.get("page")).toBe("1");
  });

  it("keeps meaningful filters", async () => {
    await listUsers({ page: 1, per_page: 15, search: "ali" });

    expect(calls[0]?.query.get("search")).toBe("ali");
  });
});
