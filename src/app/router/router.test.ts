import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { RouteLocationNormalized } from "vue-router";
import { navigationGuard, routes } from "./index";
import { useSessionStore } from "@/features/auth/stores/session";
import type { MyProfileResource } from "@/lib/api/generated/models";

const verifiedAdmin: MyProfileResource = {
  id: 1,
  name: "Admin User",
  email: "admin@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "logs.view"],
};

const verifiedStandardUser: MyProfileResource = {
  id: 2,
  name: "Standard User",
  email: "user@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["member"],
  permissions: [],
};

const limitedUser: MyProfileResource = {
  id: 3,
  name: "Limited User",
  email: "unverified@example.com",
  email_verified_at: null,
  roles: [],
  permissions: [],
};

type RouteMatched = RouteLocationNormalized["matched"][number];

function createMockRecord(meta: Record<string, unknown>): RouteMatched {
  return {
    path: "/",
    name: undefined,
    meta,
    props: {},
    children: [],
    instances: {},
    enterCallbacks: {},
    components: {},
    beforeEnter: undefined,
    aliasOf: undefined,
    redirect: undefined,
    mods: {},
    leaveGuards: new Set(),
    updateGuards: new Set(),
  };
}

function createMockRoute(
  overrides: Partial<RouteLocationNormalized>,
): RouteLocationNormalized {
  return {
    fullPath: overrides.fullPath ?? "/",
    path: overrides.path ?? "/",
    name: overrides.name ?? "public-home",
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    hash: "",
    matched: overrides.matched ?? [],
    redirectedFrom: undefined,
    meta: overrides.meta ?? {},
  };
}

describe("router routes and navigation guards", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("registers all expected public, auth, error, and administrative routes", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/login");
    expect(paths).toContain("/register");
    expect(paths).toContain("/forgot-password");
    expect(paths).toContain("/reset-password");
    expect(paths).toContain("/verify-email");
    expect(paths).toContain("/dashboard");
    expect(paths).toContain("/users");
    expect(paths).toContain("/roles");
    expect(paths).toContain("/logs");
    expect(paths).toContain("/limited");
    expect(paths).toContain("/403");
    expect(paths).toContain("/404");
    expect(paths).toContain("/:pathMatch(.*)*");
  });

  it("bootstraps session on initial route navigation if not initialized", async () => {
    const session = useSessionStore();
    const bootstrapSpy = vi.spyOn(session, "bootstrap").mockResolvedValue(null);

    const to = createMockRoute({ path: "/" });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);

    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows unauthenticated guest on public routes", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.status = "unauthenticated";
    session.user = null;

    const to = createMockRoute({ path: "/", name: "public-home" });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects unauthenticated user from protected route to login with redirect query", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.status = "unauthenticated";
    session.user = null;

    const to = createMockRoute({
      fullPath: "/dashboard",
      path: "/dashboard",
      matched: [createMockRecord({ requiresAuth: true })],
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith({
      name: "login",
      query: { redirect: "/dashboard" },
    });
  });

  it("redirects authenticated user away from guest-only route to dashboard", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = verifiedStandardUser;
    session.status = "authenticated";

    for (const path of [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ]) {
      const to = createMockRoute({
        path,
        matched: [createMockRecord({ guestOnly: true })],
      });
      const from = createMockRoute({ path: "/" });
      const next = vi.fn();

      await navigationGuard(to, from, next);
      expect(next).toHaveBeenCalledWith({ name: "dashboard" });
    }
  });

  it("allows unauthenticated guests on public verify-email route", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.status = "unauthenticated";
    session.user = null;

    const to = createMockRoute({ path: "/verify-email", name: "verify-email" });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects limited user attempting business route to /limited", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = limitedUser;
    session.status = "limited";

    const to = createMockRoute({
      path: "/dashboard",
      matched: [createMockRecord({ requiresAuth: true })],
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith({ name: "limited" });
  });

  it("allows limited user accessing route with allowLimited: true", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = limitedUser;
    session.status = "limited";

    const to = createMockRoute({
      path: "/limited",
      matched: [createMockRecord({ requiresAuth: true, allowLimited: true })],
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects user without required role to 403 forbidden", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = verifiedStandardUser;
    session.status = "authenticated";

    const to = createMockRoute({
      path: "/roles",
      matched: [createMockRecord({ requiresAuth: true })],
      meta: { requiresAuth: true, roles: ["admin"] },
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith({
      name: "forbidden",
      query: { reason: "unauthorized_role" },
    });
  });

  it("allows user with required role to enter", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = verifiedAdmin;
    session.status = "authenticated";

    const to = createMockRoute({
      path: "/roles",
      matched: [createMockRecord({ requiresAuth: true })],
      meta: { requiresAuth: true, roles: ["admin"] },
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects user without required permission to 403 forbidden", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = verifiedStandardUser;
    session.status = "authenticated";

    const to = createMockRoute({
      path: "/users",
      matched: [createMockRecord({ requiresAuth: true })],
      meta: { requiresAuth: true, permissions: ["users.view"] },
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith({
      name: "forbidden",
      query: { reason: "unauthorized_permission" },
    });
  });

  it("allows user with required permission to enter", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.user = verifiedAdmin;
    session.status = "authenticated";

    const to = createMockRoute({
      path: "/users",
      matched: [createMockRecord({ requiresAuth: true })],
      meta: { requiresAuth: true, permissions: ["users.view"] },
    });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects blocked (deactivated) account to 403 forbidden with blocked reason", async () => {
    const session = useSessionStore();
    session.isInitialized = true;
    session.status = "blocked";
    session.user = null;

    const to = createMockRoute({ path: "/dashboard", name: "dashboard" });
    const from = createMockRoute({ path: "/" });
    const next = vi.fn();

    await navigationGuard(to, from, next);
    expect(next).toHaveBeenCalledWith({
      name: "forbidden",
      query: { reason: "blocked" },
    });
  });
});
