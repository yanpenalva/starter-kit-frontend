import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeCorsHeaders,
  TEST_API_BASE,
  TEST_CSRF_TOKEN,
} from "@/test/http-handlers";
import { CSRF_COOKIE_NAME } from "@/lib/http/config";
import { queryClient } from "@/app/providers/query";
import { getAuthMyProfileQueryKey } from "@/lib/api/generated";
import {
  buildHttpError,
  isForbiddenHttpError,
  notifySessionExpired,
} from "@/lib/http";
import type {
  AuthMyProfile200,
  MyProfileResource,
} from "@/lib/api/generated/models";
import { useSessionStore } from "./session";

const PROFILE_URL = `${TEST_API_BASE}/api/v1/auth/my-profile`;
const LOGIN_URL = `${TEST_API_BASE}/api/v1/login`;
const LOGOUT_URL = `${TEST_API_BASE}/api/v1/logout`;
const CSRF_COOKIE_URL = `${TEST_API_BASE}/sanctum/csrf-cookie`;

const mockVerifiedProfile: MyProfileResource = {
  id: 1,
  name: "Maria Silva",
  email: "maria@example.com",
  email_verified_at: "2026-10-01T12:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "users.create"],
};

const mockLimitedProfile: MyProfileResource = {
  id: 2,
  name: "Carlos Santos",
  email: "carlos@example.com",
  email_verified_at: null,
  roles: [],
  permissions: [],
};

describe("useSessionStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    queryClient.clear();
    server.use(
      http.options(
        "*",
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
    );
  });

  afterEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; path=/`;
  });

  it("starts in idle unauthenticated state without credentials", () => {
    const store = useSessionStore();
    expect(store.user).toBeNull();
    expect(store.status).toBe("idle");
    expect(store.isAuthenticated).toBe(false);
    expect(store.isLimited).toBe(false);
    expect(store.isBlocked).toBe(false);
    expect(store.roles).toEqual([]);
    expect(store.permissions).toEqual([]);
  });

  it("uses the Query cache as the source of the session profile", () => {
    const store = useSessionStore();
    const profileQueryKey = getAuthMyProfileQueryKey();
    store.user = mockVerifiedProfile;
    store.status = "authenticated";

    expect(queryClient.getQueryData<AuthMyProfile200>(profileQueryKey)).toEqual(
      { data: mockVerifiedProfile },
    );

    queryClient.setQueryData<AuthMyProfile200>(profileQueryKey, {
      data: { ...mockVerifiedProfile, name: "Maria Atualizada" },
    });
    expect(store.user?.name).toBe("Maria Atualizada");

    store.clearSession();
    expect(queryClient.getQueryData(profileQueryKey)).toBeUndefined();
    expect(store.user).toBeNull();
  });

  it("bootstraps verified session correctly", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toEqual(mockVerifiedProfile);
    expect(store.user).toEqual(mockVerifiedProfile);
    expect(store.status).toBe("authenticated");
    expect(store.isAuthenticated).toBe(true);
    expect(store.isLimited).toBe(false);
    expect(store.isBlocked).toBe(false);
    expect(store.hasRole("admin")).toBe(true);
    expect(store.hasRole("editor")).toBe(false);
    expect(store.hasPermission("users.view")).toBe(true);
    expect(store.can("users.create")).toBe(true);
    expect(store.can("users.delete")).toBe(false);
  });

  it("requests csrf cookie before profile during bootstrap", async () => {
    const requested: string[] = [];
    server.use(
      http.get(CSRF_COOKIE_URL, ({ request }) => {
        requested.push("csrf");
        return new HttpResponse(null, {
          status: 204,
          headers: makeCorsHeaders(request),
        });
      }),
      http.get(PROFILE_URL, ({ request }) => {
        requested.push("profile");
        return HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toEqual(mockVerifiedProfile);
    expect(requested).toEqual(["csrf", "profile"]);
  });

  it("bootstraps limited session when email_verified_at is null", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          { data: mockLimitedProfile },
          { headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toEqual(mockLimitedProfile);
    expect(store.user).toEqual(mockLimitedProfile);
    expect(store.status).toBe("limited");
    expect(store.isAuthenticated).toBe(true);
    expect(store.isLimited).toBe(true);
    expect(store.roles).toEqual([]);
    expect(store.permissions).toEqual([]);
  });

  it("sets unauthenticated on 401 during bootstrap", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          { message: "Não autenticado." },
          { status: 401, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toBeNull();
    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
    expect(store.isAuthenticated).toBe(false);
  });

  it("keeps the current session and allows retry after a server error", async () => {
    let calls = 0;
    server.use(
      http.get(PROFILE_URL, ({ request }) => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { message: "Erro interno." },
            { status: 500, headers: makeCorsHeaders(request) },
          );
        }
        return HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );

    const store = useSessionStore();
    store.user = mockVerifiedProfile;
    store.status = "authenticated";
    const firstResult = await store.bootstrap();

    expect(firstResult).toBeNull();
    expect(store.user).toEqual(mockVerifiedProfile);
    expect(store.status).toBe("authenticated");
    expect(store.isInitialized).toBe(false);

    const retryResult = await store.bootstrap();

    expect(retryResult).toEqual(mockVerifiedProfile);
    expect(store.isInitialized).toBe(true);
    expect(calls).toBe(2);
  });

  it("shares concurrent bootstrap requests", async () => {
    let calls = 0;
    server.use(
      http.get(PROFILE_URL, async ({ request }) => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );

    const store = useSessionStore();
    const requests = [store.bootstrap(), store.bootstrap(), store.bootstrap()];

    await expect(Promise.all(requests)).resolves.toEqual([
      mockVerifiedProfile,
      mockVerifiedProfile,
      mockVerifiedProfile,
    ]);
    expect(calls).toBe(1);
  });

  it("discards a bootstrap response that completes after logout", async () => {
    let releaseResponse: (() => void) | undefined;
    server.use(
      http.get(PROFILE_URL, async ({ request }) => {
        await new Promise<void>((resolve) => {
          releaseResponse = resolve;
        });
        return HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        );
      }),
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
      http.post(
        LOGOUT_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
    );

    const store = useSessionStore();
    const bootstrapRequest = store.bootstrap();
    await vi.waitFor(() => expect(releaseResponse).toBeTypeOf("function"));
    await store.logout();
    releaseResponse?.();
    await bootstrapRequest;

    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
  });

  it("sets blocked on 403 during bootstrap (account deactivated)", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          { message: "Esta conta foi desativada." },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toBeNull();
    expect(store.user).toBeNull();
    expect(store.status).toBe("blocked");
    expect(store.isBlocked).toBe(true);
    expect(store.isAuthenticated).toBe(false);
  });

  it("does not re-fetch profile on repeated bootstrap unless forced", async () => {
    let calls = 0;
    server.use(
      http.get(PROFILE_URL, ({ request }) => {
        calls += 1;
        return HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );

    const store = useSessionStore();
    await store.bootstrap();
    await store.bootstrap();
    expect(calls).toBe(1);

    await store.bootstrap(true);
    expect(calls).toBe(2);
  });

  it("authenticates via login without persisting password", async () => {
    server.use(
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
      http.post(
        LOGIN_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const user = await store.login({
      email: "maria@example.com",
      password: "secret-password",
    });

    expect(user).toEqual(mockVerifiedProfile);
    expect(store.isAuthenticated).toBe(true);
    expect(store.status).toBe("authenticated");
    expect(JSON.stringify(store.$state)).not.toContain("secret-password");
  });

  it("clears state on failed login with 401", async () => {
    server.use(
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
      http.post(LOGIN_URL, ({ request }) =>
        HttpResponse.json(
          { message: "Credenciais inválidas." },
          { status: 401, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    await expect(
      store.login({
        email: "maria@example.com",
        password: "wrong-password",
      }),
    ).rejects.toThrow();

    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
  });

  it("clears session on logout", async () => {
    server.use(
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
      http.post(
        LOGOUT_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
    );

    const store = useSessionStore();
    store.user = mockVerifiedProfile;
    store.status = "authenticated";

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
    expect(store.isAuthenticated).toBe(false);
  });

  it("clears session and retains an actionable error when logout fails", async () => {
    server.use(
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
      http.post(LOGOUT_URL, ({ request }) =>
        HttpResponse.json(
          { message: "Erro interno." },
          { status: 500, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    store.user = mockVerifiedProfile;
    store.status = "authenticated";

    await expect(store.logout()).rejects.toMatchObject({
      kind: "server_error",
      status: 500,
    });

    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
    expect(store.errorMessage).toContain("indisponível");
  });

  it("clears session immediately on 401/419 error notification without replaying mutations", () => {
    const store = useSessionStore();
    store.user = mockVerifiedProfile;
    store.status = "authenticated";

    notifySessionExpired(buildHttpError({ kind: "unauthorized", status: 401 }));

    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
    expect(store.isAuthenticated).toBe(false);

    store.user = mockVerifiedProfile;
    store.status = "authenticated";

    notifySessionExpired(
      buildHttpError({ kind: "csrf_mismatch", status: 419 }),
    );

    expect(store.user).toBeNull();
    expect(store.status).toBe("unauthenticated");
  });

  it("checks authorization rules via isAuthorized, hasAnyRole, hasAnyPermission", () => {
    const store = useSessionStore();
    store.user = mockVerifiedProfile;
    store.status = "authenticated";

    expect(store.hasAnyRole(["admin", "manager"])).toBe(true);
    expect(store.hasAnyRole(["editor", "viewer"])).toBe(false);
    expect(store.hasAnyPermission(["users.view", "billing.read"])).toBe(true);
    expect(store.hasAnyPermission(["billing.read"])).toBe(false);

    expect(
      store.isAuthorized({ roles: ["admin"], permissions: ["users.view"] }),
    ).toBe(true);
    expect(
      store.isAuthorized({ roles: ["admin"], permissions: ["billing.read"] }),
    ).toBe(false);
    expect(
      store.isAuthorized({ roles: ["editor"], permissions: ["users.view"] }),
    ).toBe(false);
  });

  it("register creates account without authenticating or persisting sensitive credentials", async () => {
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/register`, ({ request }) =>
        HttpResponse.json(
          {
            id: 15,
            name: "Novo Usuário",
            email: "novo@example.com",
            email_verified_at: null,
          },
          { status: 201, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.register({
      name: "Novo Usuário",
      email: "novo@example.com",
      password: "password12345",
      password_confirmation: "password12345",
    });

    expect(result).toEqual({
      id: 15,
      name: "Novo Usuário",
      email: "novo@example.com",
      email_verified_at: null,
    });
    expect(store.user).toBeNull();
    expect(store.status).toBe("idle");
    expect(store.isAuthenticated).toBe(false);
    expect(JSON.stringify(store.$state)).not.toContain("password12345");
  });

  it("resendVerification requests verification notification email", async () => {
    server.use(
      http.post(
        `${TEST_API_BASE}/api/v1/email/verification-notification`,
        ({ request }) =>
          HttpResponse.json(
            { message: "Link reenviado." },
            { status: 202, headers: makeCorsHeaders(request) },
          ),
      ),
    );

    const store = useSessionStore();
    const result = await store.resendVerification();

    expect(result).toEqual({ message: "Link reenviado." });
  });

  it("forgotPassword requests reset link and returns neutral message", async () => {
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/forgot-password`, ({ request }) =>
        HttpResponse.json(
          { message: "Se o email existir, enviamos o link." },
          { status: 202, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.forgotPassword({ email: "user@example.com" });

    expect(result).toEqual({
      message: "Se o email existir, enviamos o link.",
    });
  });

  it("resetPassword sends new credentials and returns confirmation message", async () => {
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/reset-password`, ({ request }) =>
        HttpResponse.json(
          { message: "Senha redefinida com sucesso." },
          { status: 200, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.resetPassword({
      token: "valid-token",
      email: "user@example.com",
      password: "newPassword12345",
      password_confirmation: "newPassword12345",
    });

    expect(result).toEqual({
      message: "Senha redefinida com sucesso.",
    });
    expect(JSON.stringify(store.$state)).not.toContain("newPassword12345");
  });

  it("exposes pending_approval reason on 403 with blocked envelope during bootstrap", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          {
            message: "Esta conta foi desativada.",
            reason: "pending_approval",
            email_verified_at: null,
          },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toBeNull();
    expect(store.status).toBe("blocked");
    expect(store.isBlocked).toBe(true);
    expect(store.blockedReason).toBe("pending_approval");
    expect(store.blockedEmailVerifiedAt).toBeNull();
    expect(store.isPendingApproval).toBe(true);
    expect(store.isSuspended).toBe(false);
  });

  it("exposes suspended reason with verified timestamp on 403 during bootstrap", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          {
            message: "Esta conta foi desativada.",
            reason: "suspended",
            email_verified_at: "2026-09-01T10:00:00Z",
          },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toBeNull();
    expect(store.status).toBe("blocked");
    expect(store.blockedReason).toBe("suspended");
    expect(store.blockedEmailVerifiedAt).toBe("2026-09-01T10:00:00Z");
    expect(store.isPendingApproval).toBe(false);
    expect(store.isSuspended).toBe(true);
  });

  it("keeps blocked reason null on legacy 403 without envelope", async () => {
    server.use(
      http.get(PROFILE_URL, ({ request }) =>
        HttpResponse.json(
          { message: "Esta conta foi desativada." },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    const result = await store.bootstrap();

    expect(result).toBeNull();
    expect(store.status).toBe("blocked");
    expect(store.blockedReason).toBeNull();
    expect(store.blockedEmailVerifiedAt).toBeNull();
    expect(store.isPendingApproval).toBe(false);
    expect(store.isSuspended).toBe(false);
  });

  it("exposes blocked reason on 403 during login", async () => {
    server.use(
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
      http.post(LOGIN_URL, ({ request }) =>
        HttpResponse.json(
          {
            message: "Esta conta foi desativada.",
            reason: "suspended",
            email_verified_at: "2026-09-01T10:00:00Z",
          },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );

    const store = useSessionStore();
    await expect(
      store.login({
        email: "maria@example.com",
        password: "secret-password",
      }),
    ).rejects.toThrow();

    expect(store.user).toBeNull();
    expect(store.status).toBe("blocked");
    expect(store.blockedReason).toBe("suspended");
    expect(store.blockedEmailVerifiedAt).toBe("2026-09-01T10:00:00Z");
    expect(store.isSuspended).toBe(true);
  });

  it("clears blocked reason after a later successful bootstrap", async () => {
    let blocked = true;
    server.use(
      http.get(PROFILE_URL, ({ request }) => {
        if (blocked) {
          return HttpResponse.json(
            {
              message: "Esta conta foi desativada.",
              reason: "pending_approval",
              email_verified_at: null,
            },
            { status: 403, headers: makeCorsHeaders(request) },
          );
        }
        return HttpResponse.json(
          { data: mockVerifiedProfile },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );

    const store = useSessionStore();
    await store.bootstrap();
    expect(store.status).toBe("blocked");
    expect(store.blockedReason).toBe("pending_approval");

    blocked = false;
    const result = await store.bootstrap(true);

    expect(result).toEqual(mockVerifiedProfile);
    expect(store.status).toBe("authenticated");
    expect(store.blockedReason).toBeNull();
    expect(store.blockedEmailVerifiedAt).toBeNull();
    expect(store.isPendingApproval).toBe(false);
  });

  it("parses blocked details from a 403 body and discards unknown reasons", () => {
    const pending = buildHttpError({
      kind: "forbidden",
      status: 403,
      body: {
        message: "Esta conta foi desativada.",
        reason: "pending_approval",
        email_verified_at: null,
      },
    });
    expect(isForbiddenHttpError(pending)).toBe(true);
    if (isForbiddenHttpError(pending)) {
      expect(pending.blockedReason).toBe("pending_approval");
      expect(pending.blockedEmailVerifiedAt).toBeNull();
    }

    const unknown = buildHttpError({
      kind: "forbidden",
      status: 403,
      body: { message: "x", reason: "archived", email_verified_at: 12_345 },
    });
    expect(isForbiddenHttpError(unknown)).toBe(true);
    if (isForbiddenHttpError(unknown)) {
      expect(unknown.blockedReason).toBeNull();
      expect(unknown.blockedEmailVerifiedAt).toBeNull();
    }
  });
});
