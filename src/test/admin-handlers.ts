import { http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";
import { CSRF_COOKIE_NAME } from "@/lib/http/config";
import {
  makeCorsHeaders,
  TEST_API_BASE,
  TEST_CSRF_TOKEN,
} from "./http-handlers";
import type { AdminUser } from "@/features/users/api/users.types";
import type { AdminRole } from "@/features/roles/api/roles.types";
import type { AdminActivity } from "@/features/logs/api/audit.types";

export function makeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    name: "Maria Silva",
    email: "maria@example.test",
    email_verified_at: "2026-10-01T12:00:00Z",
    deactivated_at: null,
    roles: ["user"],
    ...overrides,
  };
}

export function makeAdminRole(overrides: Partial<AdminRole> = {}): AdminRole {
  return {
    id: 1,
    name: "admin",
    guard_name: "web",
    permissions: [
      "users.view",
      "users.update",
      "users.set-status",
      "users.assign-roles",
      "users.read-cpf",
      "roles.view",
      "roles.update-permissions",
      "logs.view",
    ],
    ...overrides,
  };
}

export function makeAdminActivity(
  overrides: Partial<AdminActivity> = {},
): AdminActivity {
  return {
    id: 1,
    event: "privileged.change",
    subject_type: "user",
    subject_id: 1,
    description: "privileged.change",
    properties: { correlation_id: "corr-1", actor_type: "user", actor_id: 1 },
    created_at: "2026-10-06T12:00:00Z",
    ...overrides,
  };
}

export function makePaginated<T>(
  data: T[],
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  },
): {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
} {
  const {
    current_page: currentPage,
    last_page: lastPage,
    per_page: perPage,
    total,
  } = meta;
  const from = data.length > 0 ? (currentPage - 1) * perPage + 1 : null;
  const to = data.length > 0 ? (currentPage - 1) * perPage + data.length : null;
  const basePath = `${TEST_API_BASE}/api/v1`;
  return {
    data,
    links: {
      first: `${basePath}?page=1`,
      last: `${basePath}?page=${lastPage}`,
      prev: currentPage > 1 ? `${basePath}?page=${currentPage - 1}` : null,
      next:
        currentPage < lastPage ? `${basePath}?page=${currentPage + 1}` : null,
    },
    meta: {
      current_page: currentPage,
      from,
      last_page: lastPage,
      path: basePath,
      per_page: perPage,
      to,
      total,
    },
  };
}

export interface RecordedApiCall {
  readonly method: string;
  readonly path: string;
  readonly query: URLSearchParams;
  readonly body: unknown;
}

function parseBody(body: unknown): unknown {
  if (typeof body !== "string" || body === "") {
    return null;
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

async function record(request: Request): Promise<RecordedApiCall> {
  const url = new URL(request.url);
  let raw: unknown = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    raw = parseBody(await request.clone().text());
  }
  return {
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    body: raw,
  };
}

function recordSync(request: Request): RecordedApiCall {
  const url = new URL(request.url);
  return {
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    body: null,
  };
}

function json(
  request: Request,
  body: unknown,
  status = 200,
): HttpResponse<never> {
  return HttpResponse.json(body as never, {
    status,
    headers: makeCorsHeaders(request),
  });
}

function csrfHandler(): RequestHandler {
  return http.get(
    `${TEST_API_BASE}/sanctum/csrf-cookie`,
    ({ request }) =>
      new HttpResponse(null, {
        status: 204,
        headers: makeCorsHeaders(request, {
          "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
        }),
      }),
  );
}

function preflightHandler(): RequestHandler {
  return http.options(
    "*",
    ({ request }) =>
      new HttpResponse(null, {
        status: 204,
        headers: makeCorsHeaders(request),
      }),
  );
}

export interface UsersRouteMocks {
  readonly handlers: readonly RequestHandler[];
  readonly calls: readonly RecordedApiCall[];
}

export function makeUsersRouteMocks(users: AdminUser[] = []): UsersRouteMocks {
  const calls: RecordedApiCall[] = [];

  const handlers: readonly RequestHandler[] = [
    preflightHandler(),
    csrfHandler(),
    http.get(`${TEST_API_BASE}/api/v1/users`, async ({ request }) => {
      calls.push(await record(request));
      const url = new URL(request.url);
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const status = url.searchParams.get("status");
      const role = url.searchParams.get("role");
      const page = Number(url.searchParams.get("page") ?? "1");
      const perPage = Number(url.searchParams.get("per_page") ?? "15");

      const filtered = users.filter((user) => {
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

      const start = (page - 1) * perPage;
      const pageData = filtered.slice(start, start + perPage);

      return json(
        request,
        makePaginated(pageData, {
          current_page: page,
          last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
          per_page: perPage,
          total: filtered.length,
        }),
      );
    }),

    http.get(
      `${TEST_API_BASE}/api/v1/users/:userId`,
      async ({ request, params }) => {
        calls.push(await record(request));
        const user = users.find(
          (candidate) => String(candidate.id) === String(params.userId),
        );
        if (user === undefined) {
          return json(request, { message: "Não encontrado." }, 404);
        }
        return json(request, { data: user });
      },
    ),

    http.patch(
      `${TEST_API_BASE}/api/v1/users/:userId`,
      async ({ request, params }) => {
        calls.push(await record(request));
        const user = users.find(
          (candidate) => String(candidate.id) === String(params.userId),
        );
        if (user === undefined) {
          return json(request, { message: "Não encontrado." }, 404);
        }
        const payload = (await request.json()) as Record<string, unknown>;
        return json(request, { data: { ...user, ...payload } });
      },
    ),

    http.post(
      `${TEST_API_BASE}/api/v1/users/:userId/status`,
      async ({ request, params }) => {
        calls.push(await record(request));
        const user = users.find(
          (candidate) => String(candidate.id) === String(params.userId),
        );
        if (user === undefined) {
          return json(request, { message: "Não encontrado." }, 404);
        }
        const payload = (await request.json()) as { status?: string };
        if (payload.status === "active") {
          return json(request, { data: { ...user, deactivated_at: null } });
        }
        if (payload.status === "deactivated") {
          return json(request, {
            data: { ...user, deactivated_at: "2026-10-06T12:00:00Z" },
          });
        }
        return json(request, { message: "Dados inválidos." }, 422);
      },
    ),

    http.put(
      `${TEST_API_BASE}/api/v1/users/:userId/roles`,
      async ({ request, params }) => {
        calls.push(await record(request));
        const user = users.find(
          (candidate) => String(candidate.id) === String(params.userId),
        );
        if (user === undefined) {
          return json(request, { message: "Não encontrado." }, 404);
        }
        const payload = (await request.json()) as { roles?: string[] };
        if (!Array.isArray(payload.roles) || payload.roles.length === 0) {
          return json(request, { message: "Dados inválidos." }, 422);
        }
        return json(request, {
          data: { ...user, roles: [...payload.roles].sort() },
        });
      },
    ),
  ];

  return { handlers, calls };
}

export interface RolesRouteMocks {
  readonly handlers: readonly RequestHandler[];
  readonly calls: readonly RecordedApiCall[];
}

export function makeRolesRouteMocks(roles: AdminRole[] = []): RolesRouteMocks {
  const calls: RecordedApiCall[] = [];

  const handlers: readonly RequestHandler[] = [
    preflightHandler(),
    csrfHandler(),
    http.get(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) => {
      calls.push(await record(request));
      const url = new URL(request.url);
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const page = Number(url.searchParams.get("page") ?? "1");
      const perPage = Number(url.searchParams.get("per_page") ?? "15");

      const filtered = roles.filter(
        (role) =>
          search === "" ||
          role.name.toLowerCase().includes(search) ||
          role.permissions.some((permission) =>
            permission.toLowerCase().includes(search),
          ),
      );

      const start = (page - 1) * perPage;
      const pageData = filtered.slice(start, start + perPage);

      return json(
        request,
        makePaginated(pageData, {
          current_page: page,
          last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
          per_page: perPage,
          total: filtered.length,
        }),
      );
    }),

    http.put(
      `${TEST_API_BASE}/api/v1/roles/:roleId/permissions`,
      async ({ request, params }) => {
        calls.push(await record(request));
        const role = roles.find(
          (candidate) => String(candidate.id) === String(params.roleId),
        );
        if (role === undefined) {
          return json(request, { message: "Não encontrado." }, 404);
        }
        if (role.name === "admin") {
          return json(
            request,
            { message: "Você não tem permissão para realizar esta ação." },
            403,
          );
        }
        const payload = (await request.json()) as { permissions?: string[] };
        if (!Array.isArray(payload.permissions)) {
          return json(request, { message: "Dados inválidos." }, 422);
        }
        return json(request, {
          data: { ...role, permissions: [...payload.permissions].sort() },
        });
      },
    ),
  ];

  return { handlers, calls };
}

export interface AuditRouteMocks {
  readonly handlers: readonly RequestHandler[];
  readonly calls: readonly RecordedApiCall[];
}

export interface AuditRouteOptions {
  readonly status?: number;
  readonly message?: string;
}

export function makeAuditRouteMocks(
  activities: AdminActivity[] = [],
  options: AuditRouteOptions = {},
): AuditRouteMocks {
  const calls: RecordedApiCall[] = [];

  const handlers: readonly RequestHandler[] = [
    http.get(`${TEST_API_BASE}/api/v1/activity-log`, ({ request }) => {
      calls.push(recordSync(request));
      if (options.status !== undefined) {
        return json(
          request,
          { message: options.message ?? "Erro." },
          options.status,
        );
      }
      const url = new URL(request.url);
      const event = url.searchParams.get("event");
      const subjectType = url.searchParams.get("subject_type");
      const page = Number(url.searchParams.get("page") ?? "1");
      const perPage = Number(url.searchParams.get("per_page") ?? "15");

      const filtered = activities.filter(
        (activity) =>
          (event === null || event === "" || activity.event === event) &&
          (subjectType === null ||
            subjectType === "" ||
            activity.subject_type === subjectType),
      );

      const start = (page - 1) * perPage;
      const pageData = filtered.slice(start, start + perPage);

      return json(
        request,
        makePaginated(pageData, {
          current_page: page,
          last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
          per_page: perPage,
          total: filtered.length,
        }),
      );
    }),
  ];

  return { handlers, calls };
}
