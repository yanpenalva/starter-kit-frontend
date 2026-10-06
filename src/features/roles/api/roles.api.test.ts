import { describe, expect, it, beforeEach } from "vitest";
import { server } from "@/test/server";
import { listRoles, updateRolePermissions } from "./roles.api";
import { makeAdminRole, makeRolesRouteMocks } from "@/test/admin-handlers";

const roles = [
  makeAdminRole({ id: 1, name: "admin" }),
  makeAdminRole({ id: 2, name: "user", permissions: [] }),
];

describe("roles.api", () => {
  let calls: ReturnType<typeof makeRolesRouteMocks>["calls"];

  beforeEach(() => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    calls = mocks.calls;
  });

  it("lists roles with pagination and optional search", async () => {
    const page = await listRoles({ page: 1, per_page: 15, search: "perm" });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.name).toBe("admin");
    expect(page.meta).toMatchObject({
      current_page: 1,
      per_page: 15,
      total: 1,
    });

    const call = calls[0];
    expect(call?.method).toBe("GET");
    expect(call?.path).toBe("/api/v1/roles");
    expect(call?.query.get("page")).toBe("1");
    expect(call?.query.get("per_page")).toBe("15");
    expect(call?.query.get("search")).toBe("perm");
  });

  it("replaces role permissions via PUT", async () => {
    const response = await updateRolePermissions(2, {
      permissions: ["users.view", "logs.view"],
    });

    expect(response.data.permissions).toEqual(["logs.view", "users.view"]);
    expect(calls[0]?.method).toBe("PUT");
    expect(calls[0]?.path).toBe("/api/v1/roles/2/permissions");
    expect(calls[0]?.body).toEqual({
      permissions: ["users.view", "logs.view"],
    });
  });

  it("propagates 403 for the immutable admin role", async () => {
    await expect(
      updateRolePermissions(1, { permissions: [] }),
    ).rejects.toMatchObject({ kind: "forbidden", status: 403 });
  });
});
