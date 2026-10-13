import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { isHttpError } from "@/lib/http";
import { apiBaseUrlFromEnv } from "@/lib/http/config";
import {
  assignUserRoles,
  createUser,
  deleteUser,
  listUsers,
  setUserStatus,
  showUser,
  updateUser,
} from "@/features/users/api/users.api";
import {
  createRole,
  deleteRole,
  listRoles,
  updateRolePermissions,
} from "@/features/roles/api/roles.api";
import { listActivities } from "@/features/logs/api/audit.api";
import { createMockDatabase, type MockDatabase } from "./mock-data";
import { createMockHandlers } from "./mock-handlers";
import type { MockScenario } from "./mock-scenario";

const apiBaseUrl = apiBaseUrlFromEnv(import.meta.env);

const useScenario = (scenario: MockScenario): MockDatabase => {
  const database = createMockDatabase();
  server.use(...createMockHandlers({ apiBaseUrl, database, scenario }));
  return database;
};

const statusOf = async (promise: Promise<unknown>): Promise<number | null> => {
  try {
    await promise;
    return null;
  } catch (error: unknown) {
    return isHttpError(error) ? error.status : -1;
  }
};

describe("mock user writes", () => {
  it("transitions status active and deactivated", async () => {
    const database = useScenario("full");
    expect(
      database.users.find((user) => user.id === 4)?.deactivated_at,
    ).not.toBeNull();
    const activated = await setUserStatus(4, { status: "active" });
    expect(activated.data.deactivated_at).toBeNull();
    const deactivated = await setUserStatus(2, { status: "deactivated" });
    expect(deactivated.data.deactivated_at).not.toBeNull();
    expect(
      await statusOf(setUserStatus(2, { status: "archived" as never })),
    ).toBe(422);
    expect(await statusOf(setUserStatus(999, { status: "active" }))).toBe(404);
  });

  it("assigns roles and validates the payload", async () => {
    useScenario("full");
    const assigned = await assignUserRoles(2, { roles: ["manager", "user"] });
    expect(assigned.data.roles).toEqual(["manager", "user"]);
    expect(await statusOf(assignUserRoles(2, { roles: [] }))).toBe(422);
    expect(await statusOf(assignUserRoles(999, { roles: ["user"] }))).toBe(404);
  });

  it("creates users and validates the payload", async () => {
    const database = useScenario("full");
    const created = await createUser({
      name: "Usuária Fictícia de Teste",
      email: "ficticia@example.test",
      password: "senha-longa-123",
      cpf: "12345678901",
      active: true,
    });
    expect(created.data.id).toBe(33);
    expect(created.data.roles).toEqual([]);
    expect(database.users[32]?.roles).toEqual([]);
    expect(database.users).toHaveLength(33);
    expect(
      await statusOf(
        createUser({
          name: "Curta",
          email: "curta@example.test",
          password: "curta",
          cpf: "123",
          active: true,
        }),
      ),
    ).toBe(422);
  });

  it("returns 404 for unknown user details, updates and deletes", async () => {
    useScenario("full");
    expect(await statusOf(showUser(999))).toBe(404);
    expect(await statusOf(updateUser(999, { name: "Fantasma" }))).toBe(404);
    expect(await statusOf(deleteUser(999))).toBe(404);
  });

  it("filters users by role and paginates to the last page", async () => {
    useScenario("full");
    const managers = await listUsers({ role: "manager", per_page: 50 });
    expect(managers.meta.total).toBeGreaterThan(0);
    expect(managers.data.every((user) => user.roles.includes("manager"))).toBe(
      true,
    );
    const last = await listUsers({ page: 3, per_page: 15 });
    expect(last.meta.current_page).toBe(3);
    expect(last.meta.last_page).toBe(3);
    expect(last.data).toHaveLength(2);
  });
});

describe("mock role writes", () => {
  it("creates roles and validates the payload", async () => {
    const database = useScenario("full");
    const created = await createRole({ name: "operador" });
    expect(created.data.id).toBe(6);
    expect(database.roles).toHaveLength(6);
    expect(await statusOf(createRole({ name: "" }))).toBe(422);
  });

  it("updates permissions except for the immutable admin role", async () => {
    useScenario("full");
    const updated = await updateRolePermissions(3, {
      permissions: ["users.view", "logs.view"],
    });
    expect(updated.data.permissions).toEqual(["logs.view", "users.view"]);
    expect(await statusOf(updateRolePermissions(1, { permissions: [] }))).toBe(
      403,
    );
    expect(
      await statusOf(updateRolePermissions(999, { permissions: [] })),
    ).toBe(404);
    expect(
      await statusOf(
        updateRolePermissions(2, { permissions: "nope" as never }),
      ),
    ).toBe(422);
  });

  it("deletes roles and searches by permission", async () => {
    const database = useScenario("full");
    await deleteRole(5);
    expect(database.roles).toHaveLength(4);
    expect(await statusOf(deleteRole(999))).toBe(404);
    const found = await listRoles({ search: "logs" });
    expect(found.meta.total).toBeGreaterThan(0);
  });
});

describe("mock activity log", () => {
  it("filters by event and subject type", async () => {
    useScenario("full");
    const bootstrap = await listActivities({
      event: "cli.bootstrap",
      per_page: 50,
    });
    expect(bootstrap.meta.total).toBeGreaterThan(0);
    expect(
      bootstrap.data.every((activity) => activity.event === "cli.bootstrap"),
    ).toBe(true);
    const roles = await listActivities({ subject_type: "role", per_page: 50 });
    expect(roles.meta.total).toBeGreaterThan(0);
    expect(
      roles.data.every((activity) => activity.subject_type === "role"),
    ).toBe(true);
  });

  it("searches actor names, descriptions and actions with combined filters", async () => {
    const database = useScenario("full");
    const firstActivity = database.activities[0];
    const firstActor = database.users[0];
    expect(firstActivity).toBeDefined();
    expect(firstActor).toBeDefined();

    const byActor = await listActivities({
      search: firstActor?.name.slice(0, 8),
      event: "privileged.change",
      action: "user.store",
      subject_type: "user",
      per_page: 50,
    });
    expect(byActor.meta.total).toBe(1);
    expect(byActor.data[0]?.id).toBe(firstActivity?.id);

    const byAction = await listActivities({
      search: "user.assign_roles",
      action: "user.assign_roles",
      per_page: 50,
    });
    expect(byAction.meta.total).toBeGreaterThan(0);
    expect(
      byAction.data.every(
        (activity) => activity.properties.action === "user.assign_roles",
      ),
    ).toBe(true);
  });
});

describe("mock session extras", () => {
  it("logs out and rejects the email verification link as unsupported", async () => {
    useScenario("full");
    const logout = await fetch(`${apiBaseUrl}/api/v1/logout`, {
      method: "POST",
    });
    expect(logout.status).toBe(204);
    const verify = await fetch(`${apiBaseUrl}/api/v1/email/verify/1/abc123`);
    expect(verify.status).toBe(501);
    const payload = (await verify.json()) as { message: string };
    expect(payload.message).toContain("modo mock");
  });
});
