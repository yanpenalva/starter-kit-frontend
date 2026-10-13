import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { isHttpError } from "@/lib/http";
import { apiBaseUrlFromEnv } from "@/lib/http/config";
import { makeCorsHeaders } from "@/test/http-handlers";
import {
  listUsers,
  showUser,
  updateUser,
  deleteUser,
} from "@/features/users/api/users.api";
import { listRoles } from "@/features/roles/api/roles.api";
import { listActivities } from "@/features/logs/api/audit.api";
import {
  completeMfaChallenge,
  registerUser,
} from "@/features/auth/api/auth.api";
import { createMockDatabase, type MockDatabase } from "./mock-data";
import { createMockHandlers } from "./mock-handlers";
import type { MockScenario } from "./mock-scenario";

const apiBaseUrl = apiBaseUrlFromEnv(import.meta.env);

const useScenario = (scenario: MockScenario): MockDatabase => {
  const database = createMockDatabase();
  server.use(...createMockHandlers({ apiBaseUrl, database, scenario }));
  return database;
};

describe("mock handlers", () => {
  it("serves the session flow: csrf, login and authenticated profile", async () => {
    useScenario("full");
    const csrf = await fetch(`${apiBaseUrl}/sanctum/csrf-cookie`);
    expect(csrf.status).toBe(204);
    expect(document.cookie).toContain("XSRF-TOKEN=mock-xsrf-token");
    const login = await fetch(`${apiBaseUrl}/api/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "any@example.test", password: "anything" }),
    });
    expect(login.status).toBe(204);
    const profile = await fetch(`${apiBaseUrl}/api/v1/auth/my-profile`);
    expect(profile.status).toBe(200);
    const body = (await profile.json()) as {
      data: { permissions: string[]; email_verified_at: string | null };
    };
    expect(body.data.email_verified_at).not.toBeNull();
    expect(body.data.permissions).toEqual(
      expect.arrayContaining(["users.view", "roles.view", "logs.view"]),
    );
  });

  it("serves a successful MFA challenge in the full mock scenario", async () => {
    useScenario("full");

    await expect(
      completeMfaChallenge({ code: "123456" }),
    ).resolves.toBeUndefined();
  });

  it("serves invalid MFA codes as 422 field errors", async () => {
    useScenario("full");
    server.use(
      http.post(`${apiBaseUrl}/api/v1/auth/mfa/challenge`, ({ request }) =>
        HttpResponse.json(
          {
            message: "O código informado é inválido.",
            errors: { code: ["Confira o código e tente novamente."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    await expect(
      completeMfaChallenge({ code: "000000" }),
    ).rejects.toMatchObject({
      kind: "validation",
      fieldErrors: { code: ["Confira o código e tente novamente."] },
    });
  });

  it("updates the mock profile and accepts password changes without storing them", async () => {
    const database = useScenario("full");
    const profile = await fetch(`${apiBaseUrl}/api/v1/auth/my-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nome de Conta Atualizado" }),
    });
    expect(profile.status).toBe(200);
    const profileBody = (await profile.json()) as {
      data: { name: string };
    };
    expect(profileBody.data.name).toBe("Nome de Conta Atualizado");
    expect(database.profile.name).toBe("Nome de Conta Atualizado");

    const password = await fetch(`${apiBaseUrl}/api/v1/auth/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: "senha-atual-ficticia",
        password: "senha-nova-ficticia-123",
        password_confirmation: "senha-nova-ficticia-123",
      }),
    });
    expect(password.status).toBe(200);
    expect(await password.json()).toEqual({
      message: "Senha alterada com sucesso.",
    });
  });

  it("paginates and filters the users list through the real client", async () => {
    useScenario("full");
    const page = await listUsers({ page: 2, per_page: 15 });
    expect(page.meta.total).toBe(32);
    expect(page.meta.current_page).toBe(2);
    expect(page.meta.last_page).toBe(3);
    expect(page.data).toHaveLength(15);
    const search = await listUsers({ search: "CONSTANTINOPOLOU" });
    expect(search.meta.total).toBeGreaterThan(0);
    expect(
      search.data.every((user) =>
        user.name.toUpperCase().includes("CONSTANTINOPOLOU"),
      ),
    ).toBe(true);
    const deactivated = await listUsers({ status: "deactivated" });
    expect(deactivated.meta.total).toBe(8);
    expect(deactivated.data.every((user) => user.deactivated_at !== null)).toBe(
      true,
    );
  });

  it("applies writes only to the in-memory database", async () => {
    const database = useScenario("full");
    const updated = await updateUser(2, { name: "Nome Trocado Mock" });
    expect(updated.data.name).toBe("Nome Trocado Mock");
    expect(database.users.find((user) => user.id === 2)?.name).toBe(
      "Nome Trocado Mock",
    );
    const shown = await showUser(2);
    expect(shown.data.name).toBe("Nome Trocado Mock");
    await deleteUser(3);
    const after = await listUsers({ per_page: 50 });
    expect(after.meta.total).toBe(31);
    expect(createMockDatabase().users).toHaveLength(32);
  });

  it("serves an empty list scenario while keeping the session", async () => {
    useScenario("empty");
    const users = await listUsers({ per_page: 50 });
    expect(users.meta.total).toBe(0);
    expect(users.data).toEqual([]);
    const roles = await listRoles({ per_page: 50 });
    expect(roles.meta.total).toBe(0);
    const activities = await listActivities({ per_page: 50 });
    expect(activities.meta.total).toBe(0);
    const profile = await fetch(`${apiBaseUrl}/api/v1/auth/my-profile`);
    expect(profile.status).toBe(200);
  });

  it("serves a simulated api error on list endpoints", async () => {
    useScenario("error");
    await expect(listUsers()).rejects.toThrow();
    await expect(listRoles()).rejects.toThrow();
    await expect(listActivities()).rejects.toThrow();
    const profile = await fetch(`${apiBaseUrl}/api/v1/auth/my-profile`);
    expect(profile.status).toBe(200);
  });

  it("delays list responses in the slow scenario", async () => {
    useScenario("slow");
    const startedAt = Date.now();
    const roles = await listRoles();
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1000);
    expect(roles.meta.total).toBeGreaterThan(0);
  });

  it("rejects unsupported actions with a clear simulated error", async () => {
    useScenario("full");
    const failure = await registerUser({
      name: "Alguém",
      email: "alguem@example.test",
      password: "senha-longa-123",
      password_confirmation: "senha-longa-123",
      cpf: "12345678901",
    }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).not.toBeNull();
    expect(isHttpError(failure)).toBe(true);
    if (isHttpError(failure)) {
      expect(failure.status).toBe(501);
    }
    const raw = await fetch(`${apiBaseUrl}/api/v1/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alguém" }),
    });
    expect(raw.status).toBe(501);
    const payload = (await raw.json()) as { message: string };
    expect(payload.message).toContain("modo mock");
  });
});
