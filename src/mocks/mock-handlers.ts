import { delay, http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";
import { CSRF_COOKIE_NAME } from "@/lib/http/config";
import type { AdminActivity } from "@/features/logs/api/audit.types";
import type { AdminRole } from "@/features/roles/api/roles.types";
import { isRoleImmutable } from "@/features/roles/api/roles.types";
import type { AdminUser } from "@/features/users/api/users.types";
import type { MockDatabase } from "./mock-data";
import type { MockScenario } from "./mock-scenario";

export const MOCK_CSRF_TOKEN = "mock-xsrf-token";
export const MOCK_SLOW_DELAY_MS = 1500;

export interface MockHandlerOptions {
  readonly apiBaseUrl: string;
  readonly database: MockDatabase;
  readonly scenario: MockScenario;
}

const corsHeaders = (request: Request): Record<string, string> => {
  const origin = request.headers.get("origin") ?? "http://localhost:5173";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept,X-XSRF-TOKEN",
  };
};

const json = (
  request: Request,
  body: Record<string, unknown>,
  status = 200,
): HttpResponse<Record<string, unknown>> => {
  return HttpResponse.json(body, {
    status,
    headers: corsHeaders(request),
  });
};

interface PageMeta {
  readonly current_page: number;
  readonly last_page: number;
  readonly per_page: number;
  readonly total: number;
}

const paginate = <T>(
  resourcePath: string,
  items: readonly T[],
  meta: PageMeta,
): { data: T[]; links: Record<string, string | null>; meta: object } => {
  const { current_page: page, last_page: lastPage, per_page: perPage } = meta;
  const from = items.length > 0 ? (page - 1) * perPage + 1 : null;
  const to = items.length > 0 ? (page - 1) * perPage + items.length : null;
  const pageUrl = (target: number): string => `${resourcePath}?page=${target}`;
  return {
    data: [...items],
    links: {
      first: pageUrl(1),
      last: pageUrl(lastPage),
      prev: page > 1 ? pageUrl(page - 1) : null,
      next: page < lastPage ? pageUrl(page + 1) : null,
    },
    meta: {
      current_page: page,
      from,
      last_page: lastPage,
      path: resourcePath,
      per_page: perPage,
      to,
      total: meta.total,
    },
  };
};

const paginateQuery = <T>(
  resourcePath: string,
  url: URL,
  filtered: readonly T[],
): { data: T[]; links: Record<string, string | null>; meta: object } => {
  const page = Number(url.searchParams.get("page") ?? "1");
  const perPage = Number(url.searchParams.get("per_page") ?? "15");
  const start = (page - 1) * perPage;
  return paginate(resourcePath, filtered.slice(start, start + perPage), {
    current_page: page,
    last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
    per_page: perPage,
    total: filtered.length,
  });
};

const readJsonBody = async (
  request: Request,
): Promise<Record<string, unknown>> => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const unsupported = (
  request: Request,
  action: string,
): HttpResponse<Record<string, unknown>> => {
  return json(
    request,
    {
      message: `Ação não suportada no modo mock (${action}). Use o backend real.`,
    },
    501,
  );
};

const sessionHandlers = (
  base: string,
  database: MockDatabase,
): RequestHandler[] => [
  http.options("*", ({ request }) => {
    return new HttpResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }),
  http.get(`${base}/sanctum/csrf-cookie`, ({ request }) => {
    if (typeof document !== "undefined") {
      document.cookie = `${CSRF_COOKIE_NAME}=${MOCK_CSRF_TOKEN}; Path=/; SameSite=Lax`;
    }
    return new HttpResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders(request),
        "Set-Cookie": `${CSRF_COOKIE_NAME}=${MOCK_CSRF_TOKEN}; Path=/`,
      },
    });
  }),
  http.post(`${base}/api/v1/login`, ({ request }) => {
    return new HttpResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }),
  http.post(`${base}/api/v1/logout`, ({ request }) => {
    return new HttpResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }),
  http.get(`${base}/api/v1/auth/my-profile`, ({ request }) => {
    return json(request, { data: database.profile });
  }),
  http.patch(`${base}/api/v1/auth/my-profile`, async ({ request }) => {
    const payload = await readJsonBody(request);
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (name.length === 0) {
      return json(
        request,
        {
          message: "Os dados enviados são inválidos.",
          errors: { name: ["Informe um nome válido."] },
        },
        422,
      );
    }
    database.profile.name = name;
    return json(request, { data: database.profile });
  }),
  http.put(`${base}/api/v1/auth/password`, async ({ request }) => {
    const payload = await readJsonBody(request);
    const currentPassword =
      typeof payload.current_password === "string"
        ? payload.current_password
        : "";
    const password =
      typeof payload.password === "string" ? payload.password : "";
    const confirmation =
      typeof payload.password_confirmation === "string"
        ? payload.password_confirmation
        : "";
    const errors: Record<string, string[]> = {};
    if (currentPassword.length === 0) {
      errors.current_password = ["Informe sua senha atual."];
    }
    if (password.length < 12) {
      errors.password = ["A senha deve ter pelo menos 12 caracteres."];
    }
    if (confirmation !== password) {
      errors.password_confirmation = ["A confirmação não confere."];
    }
    if (Object.keys(errors).length > 0) {
      return json(
        request,
        { message: "Os dados enviados são inválidos.", errors },
        422,
      );
    }
    return json(request, { message: "Senha alterada com sucesso." });
  }),
  http.post(`${base}/api/v1/register`, ({ request }) => {
    return unsupported(request, "cadastro");
  }),
  http.post(`${base}/api/v1/forgot-password`, ({ request }) => {
    return unsupported(request, "recuperação de senha");
  }),
  http.post(`${base}/api/v1/reset-password`, ({ request }) => {
    return unsupported(request, "redefinição de senha");
  }),
  http.post(`${base}/api/v1/email/verification-notification`, ({ request }) => {
    return unsupported(request, "reenvio de verificação");
  }),
  http.get(`${base}/api/v1/email/verify/:id/:hash`, ({ request }) => {
    return unsupported(request, "confirmação de e-mail");
  }),
];

const usersHandlers = (
  base: string,
  database: MockDatabase,
  scenario: MockScenario,
): RequestHandler[] => {
  const resource = `${base}/api/v1/users`;
  const listResolver = async ({ request }: { request: Request }) => {
    if (scenario === "error") {
      return json(
        request,
        { message: "Erro simulado do modo mock (cenário error)." },
        500,
      );
    }
    if (scenario === "slow") {
      await delay(MOCK_SLOW_DELAY_MS);
    }
    const source: readonly AdminUser[] =
      scenario === "empty" ? [] : database.users;
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    const filtered = source.filter((user) => {
      const matchesSearch =
        search === "" ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      const matchesStatus =
        status === null ||
        status === "" ||
        (status === "deactivated") === (user.deactivated_at !== null);
      const matchesRole =
        role === null || role === "" || user.roles.includes(role);
      return matchesSearch && matchesStatus && matchesRole;
    });
    return json(request, paginateQuery(resource, url, filtered));
  };
  return [
    http.get(resource, listResolver),
    http.get(`${resource}/:userId`, async ({ request, params }) => {
      const user = database.users.find(
        (candidate) => String(candidate.id) === String(params.userId),
      );
      if (user === undefined) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      return json(request, { data: user });
    }),
    http.patch(`${resource}/:userId`, async ({ request, params }) => {
      const user = database.users.find(
        (candidate) => String(candidate.id) === String(params.userId),
      );
      if (user === undefined) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      const payload = await readJsonBody(request);
      const updated = { ...user, ...payload };
      database.users.splice(database.users.indexOf(user), 1, updated);
      return json(request, { data: updated });
    }),
    http.post(`${resource}/:userId/status`, async ({ request, params }) => {
      const user = database.users.find(
        (candidate) => String(candidate.id) === String(params.userId),
      );
      if (user === undefined) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      const payload = await readJsonBody(request);
      if (payload.status === "active") {
        const updated = { ...user, deactivated_at: null };
        database.users.splice(database.users.indexOf(user), 1, updated);
        return json(request, { data: updated });
      }
      if (payload.status === "deactivated") {
        const updated = { ...user, deactivated_at: "2026-10-10T12:00:00Z" };
        database.users.splice(database.users.indexOf(user), 1, updated);
        return json(request, { data: updated });
      }
      return json(request, { message: "Dados inválidos." }, 422);
    }),
    http.put(`${resource}/:userId/roles`, async ({ request, params }) => {
      const user = database.users.find(
        (candidate) => String(candidate.id) === String(params.userId),
      );
      if (user === undefined) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      const payload = await readJsonBody(request);
      if (!Array.isArray(payload.roles) || payload.roles.length === 0) {
        return json(request, { message: "Dados inválidos." }, 422);
      }
      const updated = {
        ...user,
        roles: [...(payload.roles as string[])].sort(),
      };
      database.users.splice(database.users.indexOf(user), 1, updated);
      return json(request, { data: updated });
    }),
    http.post(resource, async ({ request }) => {
      const payload = await readJsonBody(request);
      if (
        typeof payload.name !== "string" ||
        typeof payload.email !== "string" ||
        typeof payload.password !== "string" ||
        payload.password.length < 12 ||
        typeof payload.cpf !== "string" ||
        !/^\d{11}$/.test(payload.cpf) ||
        typeof payload.active !== "boolean"
      ) {
        return json(request, { message: "Dados inválidos." }, 422);
      }
      const created: AdminUser = {
        id: Math.max(0, ...database.users.map((user) => user.id)) + 1,
        name: payload.name,
        email: payload.email,
        email_verified_at: null,
        deactivated_at: payload.active === true ? null : "2026-10-10T12:00:00Z",
        roles: ["user"],
        cpf: payload.cpf,
      };
      database.users.push(created);
      return json(request, { data: created }, 201);
    }),
    http.delete(`${resource}/:userId`, async ({ request, params }) => {
      const index = database.users.findIndex(
        (candidate) => String(candidate.id) === String(params.userId),
      );
      if (index === -1) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      database.users.splice(index, 1);
      return new HttpResponse(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }),
  ];
};

const rolesHandlers = (
  base: string,
  database: MockDatabase,
  scenario: MockScenario,
): RequestHandler[] => {
  const resource = `${base}/api/v1/roles`;
  const listResolver = async ({ request }: { request: Request }) => {
    if (scenario === "error") {
      return json(
        request,
        { message: "Erro simulado do modo mock (cenário error)." },
        500,
      );
    }
    if (scenario === "slow") {
      await delay(MOCK_SLOW_DELAY_MS);
    }
    const source: readonly AdminRole[] =
      scenario === "empty" ? [] : database.roles;
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const filtered = source.filter(
      (role) =>
        search === "" ||
        role.name.toLowerCase().includes(search) ||
        role.permissions.some((permission) =>
          permission.toLowerCase().includes(search),
        ),
    );
    return json(request, paginateQuery(resource, url, filtered));
  };
  return [
    http.get(resource, listResolver),
    http.put(`${resource}/:roleId/permissions`, async ({ request, params }) => {
      const role = database.roles.find(
        (candidate) => String(candidate.id) === String(params.roleId),
      );
      if (role === undefined) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      if (isRoleImmutable(role)) {
        return json(
          request,
          { message: "Você não tem permissão para realizar esta ação." },
          403,
        );
      }
      const payload = await readJsonBody(request);
      if (!Array.isArray(payload.permissions)) {
        return json(request, { message: "Dados inválidos." }, 422);
      }
      const updated = {
        ...role,
        permissions: [
          ...(payload.permissions as string[]),
        ].sort() as AdminRole["permissions"],
      };
      database.roles.splice(database.roles.indexOf(role), 1, updated);
      return json(request, { data: updated });
    }),
    http.post(resource, async ({ request }) => {
      const payload = await readJsonBody(request);
      if (typeof payload.name !== "string" || payload.name === "") {
        return json(request, { message: "Dados inválidos." }, 422);
      }
      const created: AdminRole = {
        id: Math.max(0, ...database.roles.map((role) => role.id)) + 1,
        name: payload.name,
        guard_name: "web",
        permissions: [],
      };
      database.roles.push(created);
      return json(request, { data: created }, 201);
    }),
    http.delete(`${resource}/:roleId`, async ({ request, params }) => {
      const index = database.roles.findIndex(
        (candidate) => String(candidate.id) === String(params.roleId),
      );
      if (index === -1) {
        return json(request, { message: "Não encontrado." }, 404);
      }
      database.roles.splice(index, 1);
      return new HttpResponse(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }),
  ];
};

const activityHandlers = (
  base: string,
  database: MockDatabase,
  scenario: MockScenario,
): RequestHandler[] => {
  const resource = `${base}/api/v1/activity-log`;
  return [
    http.get(resource, async ({ request }) => {
      if (scenario === "error") {
        return json(
          request,
          { message: "Erro simulado do modo mock (cenário error)." },
          500,
        );
      }
      if (scenario === "slow") {
        await delay(MOCK_SLOW_DELAY_MS);
      }
      const source: readonly AdminActivity[] =
        scenario === "empty" ? [] : database.activities;
      const url = new URL(request.url);
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const event = url.searchParams.get("event");
      const logName = url.searchParams.get("log_name");
      const subjectType = url.searchParams.get("subject_type");
      const filtered = source.filter(
        (activity) =>
          (search === "" ||
            activity.description.toLowerCase().includes(search)) &&
          (event === null || event === "" || activity.event === event) &&
          (logName === null ||
            logName === "" ||
            activity.log_name === logName) &&
          (subjectType === null ||
            subjectType === "" ||
            activity.subject_type === subjectType),
      );
      return json(request, paginateQuery(resource, url, filtered));
    }),
  ];
};

export const createMockHandlers = (
  options: MockHandlerOptions,
): RequestHandler[] => {
  const { apiBaseUrl, database, scenario } = options;
  return [
    ...sessionHandlers(apiBaseUrl, database),
    ...usersHandlers(apiBaseUrl, database, scenario),
    ...rolesHandlers(apiBaseUrl, database, scenario),
    ...activityHandlers(apiBaseUrl, database, scenario),
  ];
};
